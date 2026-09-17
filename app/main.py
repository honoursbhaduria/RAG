# ============================================================
# CRITICAL: logfire MUST be configured before ALL other imports
# so that spans from all modules are captured from the start.
# ============================================================
import logfire
import os
from dotenv import load_dotenv

load_dotenv()
logfire_token = os.getenv("LOGFIRE_TOKEN")
if logfire_token:
    logfire.configure(token=logfire_token, inspect_arguments=False)
else:
    logfire.configure(send_to_logfire=False, inspect_arguments=False)

# Now safe to import app modules - logfire is already active
from fastapi import FastAPI, Response, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from app.agents.graph import rag_agent
from app.guardrails import initialize_rails, guard
from app.services.code_service import generate_code_assistance
from app.services.document_service import process_and_ingest_uploaded_file
from app.services.retrieval.qdrant_service import delete_document_chunks, delete_session_chunks

from pydantic import BaseModel, Field
from typing import Optional, List


# Initialize FastAPI with /api/docs
app = FastAPI(
    title="Enterprise Agentic RAG API",
    description="""
## Enterprise Agentic RAG System API Documentation

Welcome to the interactive API documentation. You can test endpoints directly using the **Try it out** button or copy the generated **cURL** command below.

### Available Endpoints:
- **`POST /query`**: Primary endpoint for querying the knowledge base with guardrails, multi-vector search, reranking, and synthesis.
- **`GET /health`**: Health check and status endpoint.
- **`GET /graph`**: Visual workflow graph in PNG format.
- **`GET /api/docs`**: This interactive Swagger documentation.
    """,
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

if logfire_token:
    logfire.instrument_fastapi(app)

# Flexible CORS for local dev, Vercel deployments, and custom domains
raw_origins = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]
if not allowed_origins:
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=os.getenv("ALLOWED_ORIGIN_REGEX", r"^https:\/\/.*\.vercel\.app$"),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    initialize_rails()
    try:
        from app.services.retrieval.embedding import _get_local
        _get_local()
        from app.services.retrieval.ranking_service import rerank_documents
        rerank_documents("warmup", ["warmup query context"], top_n=1)
        logfire.info("Models warmed up: embedding and reranking ready.")
    except Exception as e:
        logfire.warning(f"Startup warmup skipped: {e}")


@app.get("/docs", include_in_schema=False)
def redirect_to_api_docs():
    """Redirects default /docs to /api/docs."""
    return RedirectResponse(url="/api/docs")


class QueryRequest(BaseModel):
    q: str = Field(
        ...,
        description="The question or technical query for the enterprise knowledge base.",
        example="What is SRIOV and how is it used in networking?"
    )
    thread_id: Optional[str] = Field(
        default="default_user",
        description="Session or thread ID for conversational memory retention across turns.",
        example="session_user_01"
    )
    persona: Optional[str] = Field(
        default=None,
        description="Persona mode for the synthesis engine.",
        example="Enterprise Architect"
    )
    system_prompt: Optional[str] = Field(
        default=None,
        description="Custom system instruction addendum.",
        example="Focus on low-latency kernel and hardware bypass details."
    )
    temperature: Optional[float] = Field(
        default=0.1,
        description="LLM temperature (0.0 to 1.0).",
        example=0.1
    )
    top_k: Optional[int] = Field(
        default=5,
        description="Number of context chunks to rerank and keep.",
        example=5
    )
    filename: Optional[str] = Field(
        default=None,
        description="Optional filename of an uploaded document to prioritize in context.",
        example="architecture.pdf"
    )
    filenames: Optional[List[str]] = Field(
        default=None,
        description="Optional list of filenames of uploaded documents attached to this chat session.",
        example=["architecture.pdf", "benchmarks.txt"]
    )


class QueryResponse(BaseModel):
    question: str = Field(..., description="Original user question")
    answer: Optional[str] = Field(None, description="Synthesized answer from LLM or Guardrails")
    thought_process: List[str] = Field(default=[], description="Step-by-step reasoning and execution plan")
    status: Optional[str] = Field(None, description="Execution status of the pipeline")
    sources: List[str] = Field(default=[], description="Retrieved and reranked context chunks")


class CodeAssistRequest(BaseModel):
    prompt: str = Field(..., description="Coding question, debugging request, or optimization goal", example="Write a binary search algorithm")
    code: Optional[str] = Field(None, description="Optional existing code snippet to debug or refactor")
    language: Optional[str] = Field("python", description="Language: python or javascript")
    engine: Optional[str] = Field("groq", description="LLM Engine: groq or gemini")


class CodeAssistResponse(BaseModel):
    answer: str = Field(..., description="Explanation and full response")
    code: Optional[str] = Field(None, description="Extracted runnable code block")
    language: str = Field("python", description="Detected language")
    engine: str = Field("groq", description="Engine used")
    
    
@app.get("/", tags=["System"])
def home():
    """Service status and link to interactive API docs."""
    return {
        "message": "Enterprise LangGraph RAG API is live.",
        "docs": "/api/docs"
    }


@app.get("/health", tags=["System"])
def health():
    """Health check endpoint for Kubernetes, Docker, and monitoring."""
    return {
        "status": "healthy",
        "service": "Enterprise Agentic RAG API",
        "docs": "/api/docs"
    }


@app.get("/graph", tags=["Agent Workflow"])
def get_graph_image():
    """
    Returns the Mermaid image of the agent's workflow graph.
    """
    try:
        png_bytes = rag_agent.get_graph().draw_mermaid_png()
        return Response(content=png_bytes, media_type="image/png")
    except Exception as e:
        return {"error": f"Could not generate graph image: {e}"}
    
    
MAX_SESSION_DOCUMENTS = 5
SESSION_ACTIVE_DOCS: dict[str, list[dict]] = {}


@app.post(
    "/query",
    response_model=QueryResponse,
    tags=["Agentic RAG"],
    summary="Execute Enterprise RAG Query",
    description="""
Executes the full LangGraph RAG flow with memory, NeMo Guardrails, multi-vector Qdrant retrieval, and FlashRank cross-encoder reranking.

**Example cURL:**
```bash
curl -X POST "http://localhost:8000/query" \\
  -H "Content-Type: application/json" \\
  -d '{"q": "What is SRIOV and how is it used in networking?", "thread_id": "session_user_01"}'
```
"""
)
def query(request: QueryRequest):
    """
    Executes the LangGraph RAG flow with memory using a POST request.
    Retrieval is strictly isolated to the specified thread_id / session_id.
    """
    q = request.q
    thread_id = request.thread_id or "default_user"

    # Strictly resolve active uploaded documents for this session (zero cross-chat leakage)
    session_docs = SESSION_ACTIVE_DOCS.get(thread_id, [])
    session_filenames = [d["filename"] for d in session_docs if d.get("filename")]

    if request.filenames:
        effective_filenames = [f for f in request.filenames if f]
    elif request.filename:
        effective_filenames = [request.filename]
    else:
        effective_filenames = session_filenames

    initial_state = {
        "messages": [{"role": "user", "content": q}],
        "current_query": q,
        "documents": [],
        "plan": ["Start"],
        "status": "Initializing Graph...",
        "persona": request.persona,
        "system_prompt": request.system_prompt,
        "temperature": request.temperature if request.temperature is not None else 0.1,
        "top_k": request.top_k if request.top_k is not None else 5,
        "filename": effective_filenames[0] if effective_filenames else None,
        "filenames": effective_filenames,
        "session_id": thread_id,
    }

    # Configuration for Memory (Thread ID)
    config = {"configurable": {"thread_id": thread_id}}

    try:
        # Gate 1: NeMo Guardrails — blocks overt prompt injection, XSS script tags, SQL injections, and malicious jailbreaks
        rail_fired, rail_response = guard(q)
        if rail_fired:
            logfire.info(f"Request blocked by guardrails | thread={thread_id}")
            return {
                "question": q,
                "answer": rail_response,
                "thought_process": ["Intent: Security Gate Triggered", "Action: Zero-Trust Interception", "Retrieval: Skipped"],
                "status": "Blocked by guardrails.",
                "sources": []
            }

        # Gate 2: LangGraph RAG pipeline
        final_output = rag_agent.invoke(initial_state, config=config)

        raw_docs = final_output.get("documents", [])
        extracted_sources = []
        for d in raw_docs:
            if isinstance(d, str) and d.startswith("SOURCE: "):
                src = d.split("\n")[0].replace("SOURCE: ", "").strip()
                if src and src not in extracted_sources:
                    extracted_sources.append(src)
            elif isinstance(d, dict) and "source" in d:
                src = d["source"]
                if src and src not in extracted_sources:
                    extracted_sources.append(src)

        # Include effective filenames in sources if retrieved docs are present
        for fn in effective_filenames:
            if fn not in extracted_sources and raw_docs:
                extracted_sources.insert(0, fn)

        if not extracted_sources and raw_docs:
            extracted_sources = [d[:80] + "..." if len(d) > 80 else d for d in raw_docs[:3]]

        return {
            "question": q,
            "answer": final_output.get("final_answer"),
            "thought_process": final_output.get("plan"),
            "status": final_output.get("status"),
            "sources": extracted_sources
        }
    except Exception as e:
        logfire.error(f"Backend Execution Failed: {e}")
        return {
            "question": q,
            "answer": "I apologize, but I encountered an internal error while processing your request. Please try again later.",
            "thought_process": ["Error encountered during execution."],
            "status": "error",
            "sources": []
        }


@app.post(
    "/code/assist",
    response_model=CodeAssistResponse,
    tags=["Code Studio"],
    summary="AI Code Copilot (Groq & Gemini)",
    description="Generates, explains, and debugs code using Groq or Gemini with automatic runnable code extraction."
)
def code_assist(request: CodeAssistRequest):
    """
    Executes specialized coding copilot generation using Groq or Gemini.
    Protected by NeMo & Regex Security Gate to prevent prompt injection, script payloads, and SQL exploits.
    """
    rail_fired, rail_response = guard(request.prompt)
    if rail_fired:
        return {
            "answer": rail_response or "Security Guardrail Alert: Request blocked by safety guidelines.",
            "code": None,
            "language": request.language or "python",
            "engine": "guardrails-shield"
        }

    answer, code, lang, engine_used = generate_code_assistance(
        prompt=request.prompt,
        code_context=request.code,
        language=request.language or "python",
        engine=request.engine or "groq"
    )
    return {
        "answer": answer,
        "code": code,
        "language": lang,
        "engine": engine_used
    }


class UploadFileResponse(BaseModel):
    success: bool = Field(..., description="Whether file(s) passed guardrails and was successfully indexed")
    status: str = Field(..., description="Status: indexed, partial, blocked, empty, or error")
    safe: bool = Field(..., description="Whether document(s) passed security guardrails")
    filename: str = Field(..., description="Name of the processed file (or comma-separated list)")
    session_id: Optional[str] = Field(None, description="Session or conversation ID associated with the uploaded file")
    chunks_count: Optional[int] = Field(None, description="Number of text chunks extracted")
    points_indexed: Optional[int] = Field(None, description="Number of vector points upserted to Qdrant")
    preview: Optional[str] = Field(None, description="Document preview excerpt")
    guardrail_status: Optional[str] = Field(None, description="Status from NeMo Guardrails")
    message: Optional[str] = Field(None, description="Detailed status message")
    reason: Optional[str] = Field(None, description="Rejection reason if blocked")
    files: Optional[List[dict]] = Field(default=[], description="Detailed results for each file in batch")
    total_active_documents: Optional[int] = Field(None, description="Total active files currently attached to this chat session")


@app.post(
    "/upload",
    response_model=UploadFileResponse,
    tags=["Ingestion & Guardrails"],
    summary="Upload Document(s) with Guardrails Validation & RAG Ingestion",
    description="Validates uploaded documents against NeMo Guardrails, SQL/script injection attacks, chunks content, embeds using dual vectors, and indexes into Qdrant with session isolation."
)
async def upload_document(
    files: Optional[List[UploadFile]] = File(None),
    file: Optional[UploadFile] = File(None),
    session_id: Optional[str] = Form(None)
):
    """
    Upload one or multiple documents (PDF, TXT, MD, Python, JSON, HTML, etc.).
    Enforces a strict limit of up to 5 documents per chat session.
    Every file systematically undergoes parsing, injection checks, chunking, dual embedding, and Qdrant storage.
    """
    session_key = session_id or "default_user"
    if session_key not in SESSION_ACTIVE_DOCS:
        SESSION_ACTIVE_DOCS[session_key] = []

    # Gather incoming files
    incoming_files: List[UploadFile] = []
    if files:
        incoming_files.extend([f for f in files if f.filename])
    if file and file.filename and file not in incoming_files:
        incoming_files.append(file)

    if not incoming_files:
        return {
            "success": False,
            "status": "empty",
            "safe": False,
            "filename": "",
            "session_id": session_key,
            "reason": "No valid files provided for upload.",
            "files": [],
            "total_active_documents": len(SESSION_ACTIVE_DOCS[session_key]),
        }

    # Enforce session document limit (Max 5 documents per chat)
    current_count = len(SESSION_ACTIVE_DOCS[session_key])
    if current_count + len(incoming_files) > MAX_SESSION_DOCUMENTS:
        err_msg = (
            f"Limit exceeded: Chat session already has {current_count} document(s). "
            f"Uploading {len(incoming_files)} more would exceed the limit of {MAX_SESSION_DOCUMENTS} per chat. "
            f"Please remove existing documents before uploading more."
        )
        return {
            "success": False,
            "status": "blocked",
            "safe": False,
            "filename": incoming_files[0].filename,
            "session_id": session_key,
            "reason": err_msg,
            "message": err_msg,
            "files": [],
            "total_active_documents": current_count,
        }

    processed_results = []
    total_chunks = 0
    total_points = 0
    first_preview = None

    for upload in incoming_files:
        content = await upload.read()
        result = process_and_ingest_uploaded_file(content, upload.filename, session_id=session_key)
        processed_results.append(result)

        if result.get("success"):
            # Upsert into session active docs list
            existing_idx = next(
                (i for i, d in enumerate(SESSION_ACTIVE_DOCS[session_key]) if d.get("filename") == upload.filename),
                None
            )
            doc_entry = {
                "filename": upload.filename,
                "chunks_count": result.get("chunks_count", 0),
                "points_indexed": result.get("points_indexed", 0),
                "preview": result.get("preview", ""),
            }
            if existing_idx is not None:
                SESSION_ACTIVE_DOCS[session_key][existing_idx] = doc_entry
            else:
                SESSION_ACTIVE_DOCS[session_key].append(doc_entry)

            total_chunks += result.get("chunks_count", 0)
            total_points += result.get("points_indexed", 0)
            if not first_preview:
                first_preview = result.get("preview")

    all_success = all(r.get("success") for r in processed_results)
    any_success = any(r.get("success") for r in processed_results)
    first_failure = next((r for r in processed_results if not r.get("success")), None)
    filenames_str = ", ".join([u.filename for u in incoming_files])

    if all_success:
        return {
            "success": True,
            "status": "indexed",
            "safe": True,
            "filename": filenames_str,
            "session_id": session_key,
            "chunks_count": total_chunks,
            "points_indexed": total_points,
            "preview": first_preview,
            "guardrail_status": "Verified Safe (NeMo Guardrails, SQL & Script Scanners passed)",
            "message": f"Successfully indexed {len(incoming_files)} file(s) into chat session ({total_chunks} chunks).",
            "files": processed_results,
            "total_active_documents": len(SESSION_ACTIVE_DOCS[session_key]),
        }
    elif any_success:
        return {
            "success": True,
            "status": "partial",
            "safe": True,
            "filename": filenames_str,
            "session_id": session_key,
            "chunks_count": total_chunks,
            "points_indexed": total_points,
            "preview": first_preview,
            "guardrail_status": "Partial (Some files rejected by security checks)",
            "message": f"Partially indexed: {sum(1 for r in processed_results if r.get('success'))} succeeded, {sum(1 for r in processed_results if not r.get('success'))} rejected.",
            "files": processed_results,
            "total_active_documents": len(SESSION_ACTIVE_DOCS[session_key]),
        }
    else:
        return {
            "success": False,
            "status": first_failure.get("status", "blocked") if first_failure else "blocked",
            "safe": False,
            "filename": filenames_str,
            "session_id": session_key,
            "reason": first_failure.get("reason", "Files failed safety checks.") if first_failure else "Failed safety check.",
            "message": first_failure.get("reason", "Files failed safety checks.") if first_failure else "Failed safety check.",
            "files": processed_results,
            "total_active_documents": len(SESSION_ACTIVE_DOCS[session_key]),
        }


@app.get("/session/{session_id}/documents", tags=["Ingestion & Guardrails"])
def get_session_documents(session_id: str):
    """Returns all active documents currently attached to this chat session."""
    docs = SESSION_ACTIVE_DOCS.get(session_id, [])
    return {"session_id": session_id, "documents": docs, "count": len(docs)}


@app.delete("/session/{session_id}/documents/{filename}", tags=["Ingestion & Guardrails"])
def delete_session_document(session_id: str, filename: str):
    """Deletes a specific document from a chat session and purges its vectors from Qdrant."""
    delete_document_chunks(filename=filename, session_id=session_id)
    if session_id in SESSION_ACTIVE_DOCS:
        SESSION_ACTIVE_DOCS[session_id] = [
            d for d in SESSION_ACTIVE_DOCS[session_id] if d.get("filename") != filename
        ]
    return {
        "success": True,
        "message": f"Document '{filename}' deleted from session '{session_id}'.",
        "session_id": session_id,
        "remaining_documents": SESSION_ACTIVE_DOCS.get(session_id, [])
    }


@app.delete("/session/{session_id}/documents", tags=["Ingestion & Guardrails"])
def clear_session_documents(session_id: str):
    """Clears all documents from a chat session and purges all its vectors from Qdrant."""
    delete_session_chunks(session_id=session_id)
    if session_id in SESSION_ACTIVE_DOCS:
        SESSION_ACTIVE_DOCS[session_id] = []
    return {
        "success": True,
        "message": f"All documents cleared for session '{session_id}'.",
        "session_id": session_id
    }
