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

def search_enterprise_knowledge(query: str, limit: int = 8):
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

    for vector_name in (GEMINI_VECTOR, LOCAL_VECTOR):
        vector = query_vectors.get(vector_name)
        if vector is None:
            continue

        try:
            response = client.query_points(
                collection_name=settings.QDRANT_COLLECTION,
                query=vector,
                using=vector_name,          # target the matching named vector field
                limit=limit,
                with_payload=True,
            )
        except Exception as e:
            # An empty/missing field or dim mismatch shouldn't kill the whole search.
            logfire.warning(f"Qdrant search on '{vector_name}' vector failed: {e}")
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
