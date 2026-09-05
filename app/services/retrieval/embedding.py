import time
import logfire
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from app.config import settings

BATCH_SIZE = 50

# ── Named vector fields in Qdrant ───────────────────────────────────────────────
# A single collection stores BOTH embedding types side by side, so documents
# embedded with Gemini and documents embedded with the local fallback can coexist.
GEMINI_VECTOR = "gemini"
LOCAL_VECTOR = "local"

GEMINI_DIM = 3072   # models/gemini-embedding-2-preview
LOCAL_DIM = 768     # all-mpnet-base-v2

VECTOR_DIMS = {
    GEMINI_VECTOR: GEMINI_DIM,
    LOCAL_VECTOR: LOCAL_DIM,
}

_gemini_model = None
_local_model = None
_gemini_probed = False


# ── Model initialisation ─────────────────────────────────────────────────────────

def _get_gemini():
    """Return a working Gemini embeddings model, or None if unavailable. Probed once."""
    global _gemini_model, _gemini_probed
    if _gemini_probed:
        return _gemini_model
    _gemini_probed = True

    if not settings.GEMINI_API_KEY:
        logfire.info("No GEMINI_API_KEY set — using local embeddings only.")
        _gemini_model = None
        return None

    try:
        model = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-2-preview",
            google_api_key=settings.GEMINI_API_KEY,
        )
        model.embed_query("probe")
        logfire.info("Gemini embeddings ready (gemini-embedding-2-preview, 3072-dim).")
        _gemini_model = model
    except Exception as e:
        logfire.warning(f"Gemini probe failed: {e}. Local fallback will be used.")
        _gemini_model = None
    return _gemini_model


def _get_local():
    """Lazy-load the sentence-transformers fallback (768-dim). Loaded once."""
    global _local_model
    if _local_model is None:
        from sentence_transformers import SentenceTransformer
        logfire.info("Loading sentence-transformers fallback (all-mpnet-base-v2, 768-dim).")
        _local_model = SentenceTransformer("all-mpnet-base-v2")
    return _local_model


# ── Low-level embedding calls ─────────────────────────────────────────────────────

def _is_rate_limit(err: Exception) -> bool:
    e = str(err).lower()
    return any(x in e for x in ("429", "rate", "quota", "resource_exhausted"))


GEMINI_MAX_ATTEMPTS = 4


def _gemini_embed_documents(batch: list[str]) -> list[list[float]]:
    """
    Embed a batch with Gemini, retrying rate-limits with exponential backoff
    (1s → 2s → 4s → 8s) for up to GEMINI_MAX_ATTEMPTS attempts.
    Raises after the 4th failed attempt so the caller falls back to the local model.
    """
    model = _get_gemini()
    for attempt in range(GEMINI_MAX_ATTEMPTS):
        try:
            return model.embed_documents(batch)
        except Exception as e:
            if _is_rate_limit(e) and attempt < GEMINI_MAX_ATTEMPTS - 1:
                wait = 2 ** attempt
                logfire.warning(
                    f"Gemini rate limit — retrying in {wait}s "
                    f"(attempt {attempt + 1}/{GEMINI_MAX_ATTEMPTS})."
                )
                time.sleep(wait)
            else:
                raise
    raise RuntimeError(
        f"Gemini rate limit persisted after {GEMINI_MAX_ATTEMPTS} attempts."
    )


def _local_embed_documents(batch: list[str]) -> list[list[float]]:
    return _get_local().encode(batch, show_progress_bar=False).tolist()


# ── Ingestion API ─────────────────────────────────────────────────────────────────

_gemini_exhausted = False  # set once Gemini burns all 4 attempts — sticky for the run


def embed_documents_with_fallback(chunks: list[str]) -> list[tuple[str, list[float]]]:
    """
    Embed document chunks for ingestion.

    Tries Gemini first (3072-dim). If a batch still fails after
    GEMINI_MAX_ATTEMPTS (4) rate-limited attempts, the pipeline permanently
    shifts to the sentence-transformers model (768-dim) for the remainder of
    the run — so ingestion always completes instead of dying on quota.

    Returns a list of (vector_name, vector) tuples aligned with `chunks`, where
    vector_name is GEMINI_VECTOR ("gemini") or LOCAL_VECTOR ("local"). Each
    point is stored under the named vector field matching its producer.
    """
    global _gemini_exhausted

    results: list[tuple[str, list[float]]] = []
    gemini_available = _get_gemini() is not None

    for i in range(0, len(chunks), BATCH_SIZE):
        batch = chunks[i : i + BATCH_SIZE]

        if gemini_available and not _gemini_exhausted:
            try:
                with logfire.span("Embed batch (gemini)", start=i, size=len(batch)):
                    vecs = _gemini_embed_documents(batch)
                results.extend((GEMINI_VECTOR, v) for v in vecs)
                continue
            except Exception as e:
                _gemini_exhausted = True
                logfire.warning(
                    f"Gemini exhausted after {GEMINI_MAX_ATTEMPTS} attempts on batch @{i} ({e}). "
                    "Shifting to sentence-transformers (768-dim) for the rest of this run."
                )

        with logfire.span("Embed batch (local)", start=i, size=len(batch)):
            vecs = _local_embed_documents(batch)
        results.extend((LOCAL_VECTOR, v) for v in vecs)

    return results


# ── Query API ───────────────────────────────────────────────────────────────────

def embed_query(query: str) -> dict[str, list[float]]:
    """Embed a query with all available models. {vector_name: vector}."""
    out: dict[str, list[float]] = {}

    gemini = _get_gemini()
    if gemini is not None:
        try:
            out[GEMINI_VECTOR] = gemini.embed_query(query)
        except Exception as e:
            logfire.warning(f"Gemini query embed failed: {e}. Using local only.")

    # Always provide the local vector too, so we can match locally-embedded docs.
    out[LOCAL_VECTOR] = _get_local().encode([query])[0].tolist()
    return out
