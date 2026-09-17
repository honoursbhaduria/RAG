import urllib.request
import logfire
from qdrant_client import QdrantClient
from qdrant_client.http import models
from app.config import settings
from app.services.retrieval.embedding import embed_query, GEMINI_VECTOR, LOCAL_VECTOR


def _is_qdrant_server_running(url: str = "http://localhost:6333") -> bool:
    try:
        req = urllib.request.Request(f"{url.rstrip('/')}/readyz", method="GET")
        with urllib.request.urlopen(req, timeout=1) as resp:
            return resp.status == 200
    except Exception:
        return False


def get_qdrant_client() -> QdrantClient:
    """
    Initializes the Qdrant client with a clear precedence:
      1. QDRANT_CLUSTER_ENDPOINT (+ API key)  → remote cluster / Qdrant Cloud (production).
      2. A local Qdrant server running on :6333 → used for local dev.
      3. Embedded disk-persisted storage at QDRANT_PATH → last-resort offline fallback.
    """
    url = (settings.QDRANT_URL or "").strip()
    if url:
        logfire.info(f"Connecting to Qdrant cluster at {url}.")
        return QdrantClient(
            url=url,
            api_key=settings.QDRANT_API_KEY or None,
            timeout=30,
        )

    if _is_qdrant_server_running("http://localhost:6333"):
        logfire.info("Detected active local Qdrant server at http://localhost:6333.")
        return QdrantClient(url="http://localhost:6333")

    logfire.warning(
        "No Qdrant endpoint configured and no local server found — "
        f"falling back to embedded storage at {settings.QDRANT_PATH}."
    )
    return QdrantClient(path=settings.QDRANT_PATH)


# Initialize Qdrant Client
client = get_qdrant_client()

def ensure_payload_indexes():
    """Ensures keyword payload indexes on source and session_id exist in Qdrant."""
    for field in ("source", "session_id", "source_type"):
        try:
            client.create_payload_index(
                collection_name=settings.QDRANT_COLLECTION,
                field_name=field,
                field_schema=models.PayloadSchemaType.KEYWORD
            )
        except Exception:
            pass

ensure_payload_indexes()

def get_document_chunks(filename: str, session_id: str | None = None, limit: int = 15) -> list[dict]:
    """
    Directly retrieves sequential text chunks belonging to a specific uploaded document.
    Crucial for document-level requests like 'summarize this document' or 'tell me about my resume'.
    """
    if not filename:
        return []

    try:
        # Step 1: Try exact match with session_id if provided
        must_conditions = [
            models.FieldCondition(
                key="source",
                match=models.MatchValue(value=filename)
            )
        ]
        if session_id:
            must_conditions.append(
                models.FieldCondition(
                    key="session_id",
                    match=models.MatchValue(value=session_id)
                )
            )

        scroll_filter = models.Filter(must=must_conditions)
        points, _ = client.scroll(
            collection_name=settings.QDRANT_COLLECTION,
            scroll_filter=scroll_filter,
            limit=limit,
            with_payload=True,
            with_vectors=False
        )

        # Step 2: If session_id provided, do not leak across sessions; only match within session
        if not points and session_id:
            # Case-insensitive source fallback within the SAME session
            all_pts, _ = client.scroll(
                collection_name=settings.QDRANT_COLLECTION,
                scroll_filter=models.Filter(
                    must=[models.FieldCondition(key="session_id", match=models.MatchValue(value=session_id))]
                ),
                limit=100,
                with_payload=True,
                with_vectors=False
            )
            fn_clean = filename.lower().strip()
            points = [
                p for p in all_pts
                if p.payload and (
                    fn_clean in str(p.payload.get("source", "")).lower() or
                    str(p.payload.get("source", "")).lower() in fn_clean
                )
            ][:limit]
        elif not points and not session_id:
            # Global fallback when no session_id is used
            all_pts, _ = client.scroll(
                collection_name=settings.QDRANT_COLLECTION,
                limit=100,
                with_payload=True,
                with_vectors=False
            )
            fn_clean = filename.lower().strip()
            points = [
                p for p in all_pts
                if p.payload and (
                    fn_clean in str(p.payload.get("source", "")).lower() or
                    str(p.payload.get("source", "")).lower() in fn_clean
                )
            ][:limit]

        results = []
        for p in points:
            payload = p.payload or {}
            results.append({
                "content": payload.get("text", ""),
                "source": payload.get("source", filename),
                "score": 1.0,
                "embedder": payload.get("embedder", "direct_document"),
            })
        logfire.info(f"Direct lookup for '{filename}' returned {len(results)} chunks.")
        return results
    except Exception as e:
        logfire.warning(f"get_document_chunks failed for '{filename}': {e}")
        return []


def search_enterprise_knowledge(
    query: str,
    limit: int = 8,
    filter_source: str | None = None,
    session_id: str | None = None
):
    """
    Searches the enterprise knowledge base across BOTH named vector fields.

    Documents embedded with Gemini live in the "gemini" field (3072-dim) and
    documents embedded with the sentence-transformers fallback live in the
    "local" field (768-dim). Each field is queried separately with its matching
    query vector, then the two result sets are merged and de-duplicated so a
    query surfaces relevant chunks regardless of which model embedded them.
    """
    try:
        query_vectors = embed_query(query)  # {vector_name: vector}
    except Exception as e:
        logfire.error(f"❌ Query embedding failed: {e}")
        return []

    merged: dict[str, dict] = {}

    # Build optional filter if files or session are targeted
    query_filter = None
    should_conditions = []
    if filter_source:
        if isinstance(filter_source, str):
            should_conditions.append(
                models.FieldCondition(key="source", match=models.MatchValue(value=filter_source))
            )
        elif isinstance(filter_source, (list, tuple, set)):
            for fs in filter_source:
                if fs:
                    should_conditions.append(
                        models.FieldCondition(key="source", match=models.MatchValue(value=fs))
                    )
    if session_id:
        should_conditions.append(
            models.FieldCondition(key="session_id", match=models.MatchValue(value=session_id))
        )

    if should_conditions:
        query_filter = models.Filter(should=should_conditions)

    for vector_name in (GEMINI_VECTOR, LOCAL_VECTOR):
        vector = query_vectors.get(vector_name)
        if vector is None:
            continue

        try:
            response = client.query_points(
                collection_name=settings.QDRANT_COLLECTION,
                query=vector,
                query_filter=query_filter,
                using=vector_name,          # target the matching named vector field
                limit=limit,
                with_payload=True,
            )
        except Exception as e:
            # Fall back without query filter if filter index is not yet built
            try:
                response = client.query_points(
                    collection_name=settings.QDRANT_COLLECTION,
                    query=vector,
                    using=vector_name,
                    limit=limit,
                    with_payload=True,
                )
            except Exception as e2:
                logfire.warning(f"Qdrant search on '{vector_name}' vector failed: {e2}")
                continue

        for res in response.points:
            payload = res.payload or {}
            key = str(res.id)
            candidate = {
                "content": payload.get("text", ""),
                "source": payload.get("source", "Unknown"),
                "score": res.score,
                "embedder": payload.get("embedder", vector_name),
            }
            # Keep the higher-scoring copy if the same chunk comes back twice.
            if key not in merged or candidate["score"] > merged[key]["score"]:
                merged[key] = candidate

    results = sorted(merged.values(), key=lambda d: d["score"], reverse=True)[:limit]
    logfire.info(
        f"Vector search merged {len(results)} results "
        f"(searched fields: {', '.join(query_vectors.keys())})."
    )
    return results


def delete_document_chunks(filename: str, session_id: str | None = None) -> bool:
    """
    Deletes all vector points associated with a specific filename,
    optionally restricted to a specific session_id.
    """
    if not filename:
        return False
    try:
        must_conditions = [
            models.FieldCondition(key="source", match=models.MatchValue(value=filename))
        ]
        if session_id:
            must_conditions.append(
                models.FieldCondition(key="session_id", match=models.MatchValue(value=session_id))
            )
        client.delete(
            collection_name=settings.QDRANT_COLLECTION,
            points_selector=models.FilterSelector(
                filter=models.Filter(must=must_conditions)
            )
        )
        logfire.info(f"Deleted vector chunks for document '{filename}' (session='{session_id}')")
        return True
    except Exception as e:
        logfire.warning(f"Failed to delete vector chunks for '{filename}': {e}")
        return False


def delete_session_chunks(session_id: str) -> bool:
    """
    Deletes all vector points associated with a specific session_id.
    """
    if not session_id:
        return False
    try:
        client.delete(
            collection_name=settings.QDRANT_COLLECTION,
            points_selector=models.FilterSelector(
                filter=models.Filter(
                    must=[models.FieldCondition(key="session_id", match=models.MatchValue(value=session_id))]
                )
            )
        )
        logfire.info(f"Deleted all vector chunks for session '{session_id}'")
        return True
    except Exception as e:
        logfire.warning(f"Failed to delete session vector chunks for '{session_id}': {e}")
        return False


def get_session_chunks(session_id: str, limit: int = 30, filter_sources: list[str] | None = None) -> list[dict]:
    """
    Retrieves chunks belonging exclusively to a specific session_id.
    Guarantees no points from other sessions leak in.
    """
    if not session_id:
        return []
    try:
        must_conditions = [
            models.FieldCondition(key="session_id", match=models.MatchValue(value=session_id))
        ]
        if filter_sources:
            must_conditions.append(
                models.Filter(
                    should=[
                        models.FieldCondition(key="source", match=models.MatchValue(value=src))
                        for src in filter_sources if src
                    ]
                )
            )
        points, _ = client.scroll(
            collection_name=settings.QDRANT_COLLECTION,
            scroll_filter=models.Filter(must=must_conditions),
            limit=limit,
            with_payload=True,
            with_vectors=False,
        )
        results = []
        for p in points:
            payload = p.payload or {}
            text = payload.get("text", "")
            if text:
                results.append({
                    "content": text,
                    "source": payload.get("source", "Uploaded Document"),
                    "score": 1.0,
                    "embedder": payload.get("embedder", "direct_session"),
                })
        logfire.info(f"Fetched {len(results)} chunks for session '{session_id}'.")
        return results
    except Exception as e:
        logfire.warning(f"Failed to fetch session chunks for '{session_id}': {e}")
        return []


def search_session_documents(
    query: str,
    session_id: str,
    limit: int = 10,
    filter_sources: list[str] | None = None
) -> list[dict]:
    """
    Performs semantic vector search strictly partitioned to a specific chat session_id.
    Guarantees zero cross-session context pollution.
    """
    if not session_id:
        return []

    try:
        query_vectors = embed_query(query)
    except Exception as e:
        logfire.error(f"❌ Query embedding failed: {e}")
        return []

    # Must match session_id
    must_conditions = [
        models.FieldCondition(key="session_id", match=models.MatchValue(value=session_id))
    ]
    if filter_sources:
        must_conditions.append(
            models.Filter(
                should=[
                    models.FieldCondition(key="source", match=models.MatchValue(value=src))
                    for src in filter_sources if src
                ]
            )
        )

    session_filter = models.Filter(must=must_conditions)
    merged: dict[str, dict] = {}

    for vector_name in (GEMINI_VECTOR, LOCAL_VECTOR):
        vector = query_vectors.get(vector_name)
        if vector is None:
            continue

        try:
            response = client.query_points(
                collection_name=settings.QDRANT_COLLECTION,
                query=vector,
                query_filter=session_filter,
                using=vector_name,
                limit=limit,
                with_payload=True,
            )
            for res in response.points:
                payload = res.payload or {}
                key = str(res.id)
                candidate = {
                    "content": payload.get("text", ""),
                    "source": payload.get("source", "Unknown"),
                    "score": res.score,
                    "embedder": payload.get("embedder", vector_name),
                }
                if key not in merged or candidate["score"] > merged[key]["score"]:
                    merged[key] = candidate
        except Exception as e:
            logfire.warning(f"Session search on '{vector_name}' failed: {e}")

    results = sorted(merged.values(), key=lambda d: d["score"], reverse=True)[:limit]
    logfire.info(f"Session '{session_id}' vector search returned {len(results)} chunks.")
    return results
