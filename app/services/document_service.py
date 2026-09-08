import os
import re
import time
import uuid
import tempfile
import logfire
from qdrant_client.http import models

from app.config import settings
from app.guardrails.rails import guard
from app.ingestion.chunking.splitter import chunk_text
from app.services.retrieval.embedding import embed_documents_with_fallback
from app.services.retrieval.qdrant_service import client as qdrant_client
from app.ingestion.processor import save_processed_locally

# Known malicious prompt injection, jailbreak, and policy evasion signatures
JAILBREAK_PATTERNS = [
    r"ignore\s+(all\s+)?previous\s+instructions",
    r"disregard\s+(all\s+)?(your\s+)?(previous\s+)?instructions",
    r"disregard\s+your\s+training",
    r"you\s+are\s+now\s+(dan|unrestricted|in\s+developer\s+mode|jailbroken)",
    r"pretend\s+(you\s+have|to\s+have)\s+no\s+restrictions",
    r"override\s+(your\s+|the\s+)?(safety\s+|content\s+)?(filters|guidelines|rules)",
    r"bypass\s+(your\s+|the\s+)?(safety\s+|content\s+)?(filters|guidelines|policy)",
    r"act\s+as\s+an?\s+unrestricted\s+ai",
    r"forget\s+your\s+system\s+prompt",
    r"reveal\s+(your\s+)?(secret\s+|system\s+)?(prompt|keys|tokens|credentials)",
    r"exfiltrate\s+(all\s+)?(environment|api_key|database)",
]


def validate_document_safety(content: str, filename: str) -> tuple[bool, str | None]:
    """
    Validates document content against prompt injection, jailbreak vectors,
    and NeMo Guardrails policy gates before allowing ingestion into the RAG pipeline.
    """
    with logfire.span("Document Guardrails Verification", file=filename):
        content_lower = content.lower()

        # 1. Regex pattern check for prompt injections & jailbreak exploits
        for pattern in JAILBREAK_PATTERNS:
            if re.search(pattern, content_lower):
                logfire.warning(
                    f"Prompt injection / jailbreak detected in uploaded file '{filename}' (matched '{pattern}')"
                )
                return False, f"Guardrail Violation: File '{filename}' contains disallowed prompt injection pattern ('{pattern}')."

        # 2. Check document header / sample segments against NeMo rails
        # Run first 800 chars through NeMo guard gate
        sample_query = content[:800].strip()
        if sample_query:
            try:
                rail_fired, rail_response = guard(sample_query)
                if rail_fired:
                    logfire.warning(
                        f"NeMo Guardrails rejected document sample for '{filename}'"
                    )
                    return False, f"Guardrail Policy Violation: {rail_response or 'Content violates safety guidelines.'}"
            except Exception as e:
                logfire.warning(f"NeMo guardrail check error on doc sample: {e}")

        logfire.info(f"Document '{filename}' passed all safety and guardrails checks.")
        return True, None


def parse_uploaded_file(file_bytes: bytes, filename: str) -> str:
    """
    Extracts text from uploaded file bytes according to file type.
    Supports PDF, HTML, plain text, Markdown, Python, JSON, CSV, YAML, Shell, SQL, DOCX.
    """
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else "txt"

    with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        if ext == "pdf":
            from app.ingestion.loaders.pdf import parse_pdf
            return parse_pdf(tmp_path)
        elif ext in ("html", "htm"):
            from app.ingestion.loaders.html import parse_html
            return parse_html(tmp_path)
        elif ext in ("docx", "pptx"):
            from app.ingestion.loaders.office import parse_office
            return parse_office(tmp_path)
        else:
            # Plain text, markdown, source code, configs, json
            try:
                return file_bytes.decode("utf-8")
            except UnicodeDecodeError:
                return file_bytes.decode("latin-1", errors="ignore")
    finally:
        try:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
        except Exception:
            pass


def ingest_document_to_rag(
    full_text: str,
    filename: str,
    source_type: str = "user_upload",
    session_id: str | None = None
) -> dict:
    """
    Executes the RAG ingestion pipeline: chunking, dual vector embedding, and Qdrant indexing.
    Tags vectors with session_id to enable session-scoped retrieval in active chats.
    """
    with logfire.span("RAG Ingestion Pipeline", file=filename, source=source_type, session_id=session_id):
        chunks = chunk_text(full_text)
        if not chunks:
            raise ValueError(f"Document '{filename}' yielded no text chunks after parsing.")

        # Dual vector embedding (Gemini 3072-d with local 768-d fallback)
        embedded = embed_documents_with_fallback(chunks)

        points = [
            models.PointStruct(
                id=str(uuid.uuid4()),
                vector={vector_name: vector},
                payload={
                    "text": chunk,
                    "source": filename,
                    "source_type": source_type,
                    "session_id": session_id or "",
                    "embedder": vector_name,
                    "timestamp": time.time(),
                },
            )
            for chunk, (vector_name, vector) in zip(chunks, embedded)
        ]

        qdrant_client.upsert(
            collection_name=settings.QDRANT_COLLECTION,
            points=points,
        )

        # Save metadata record locally
        processed_data = {
            "filename": filename,
            "session_id": session_id,
            "source_type": source_type,
            "chunks": chunks,
            "indexed_points": len(points),
            "timestamp": time.time()
        }
        save_processed_locally(processed_data, source_type, filename)

        # Generate a brief preview / summary of first chunk
        preview = chunks[0][:300] + "..." if len(chunks[0]) > 300 else chunks[0]

        logfire.info(f"Successfully indexed {len(points)} chunks from '{filename}' into Qdrant.")
        return {
            "chunks_count": len(chunks),
            "points_indexed": len(points),
            "preview": preview,
        }


def process_and_ingest_uploaded_file(
    file_bytes: bytes,
    filename: str,
    session_id: str | None = None
) -> dict:
    """
    End-to-end handler for uploaded files:
    Extract text -> Run Guardrails -> Chunk & Embed -> Index in Qdrant with session metadata.
    """
    text = parse_uploaded_file(file_bytes, filename)
    if not text or not text.strip():
        return {
            "success": False,
            "status": "empty",
            "safe": False,
            "filename": filename,
            "session_id": session_id,
            "reason": "File is empty or no readable text could be extracted."
        }

    # Step 1: Guardrails verification
    is_safe, violation_reason = validate_document_safety(text, filename)
    if not is_safe:
        return {
            "success": False,
            "status": "blocked",
            "safe": False,
            "filename": filename,
            "session_id": session_id,
            "reason": violation_reason
        }

    # Step 2: RAG Pipeline ingestion
    try:
        res = ingest_document_to_rag(text, filename, session_id=session_id)
        return {
            "success": True,
            "status": "indexed",
            "safe": True,
            "filename": filename,
            "session_id": session_id,
            "chunks_count": res["chunks_count"],
            "points_indexed": res["points_indexed"],
            "preview": res.get("preview", ""),
            "guardrail_status": "Verified Safe (NeMo Guardrails & Injection Scanners passed)",
            "message": f"File '{filename}' passed safety guardrails and is indexed into Enterprise RAG ({res['chunks_count']} chunks)."
        }
    except Exception as e:
        logfire.error(f"Error ingesting document '{filename}': {e}")
        return {
            "success": False,
            "status": "error",
            "safe": True,
            "filename": filename,
            "session_id": session_id,
            "reason": f"Ingestion pipeline failed: {str(e)}"
        }
