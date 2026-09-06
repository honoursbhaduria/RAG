import logfire
from portkey_ai import Portkey, createHeaders, PORTKEY_GATEWAY_URL
from langchain_openai import ChatOpenAI

from app.config import settings


# Production gateway config:
#   - Fallback: primary @rag/llama-3.3-70b-versatile → @brag/llama-3.1-8b-instant on failure
#   - Cache: semantic mode (requires Portkey Enterprise — silently falls back to simple on free/starter)
#   - Retry: 2 attempts on rate limit / server error before triggering the fallback target
GATEWAY_CONFIG = {
    "strategy": {"mode": "fallback"},
    "cache": {"mode": "simple"},
    "retry": {
        "attempts": 2,
        "on_status_codes": [429, 503]
    },
    "targets": [
        {"override_params": {"model": f"@{settings.GROQ_SLUG}/{settings.GROQ_MODEL}"}},
        {"override_params": {"model": f"@{settings.GROQ_SLUG_2}/{settings.GROQ_FALLBACK_MODEL}"}},
    ]
}

portkey_client = Portkey(
    api_key=settings.PORTKEY_API_KEY or "pk-dummy-key",
    config=GATEWAY_CONFIG
)


def get_langchain_llm(feature: str = "rag"):
    """
    Returns a Portkey-backed ChatOpenAI when PORTKEY_API_KEY is configured.
    Otherwise, falls back to direct ChatGroq execution using settings.GROQ_API_KEY.
    """
    if settings.PORTKEY_API_KEY and settings.PORTKEY_API_KEY.strip():
        api_key = settings.PORTKEY_API_KEY.strip()
        return ChatOpenAI(
            api_key=api_key,
            base_url=PORTKEY_GATEWAY_URL,
            model=f"@{settings.GROQ_SLUG}/{settings.GROQ_MODEL}",
            temperature=0,
            default_headers=createHeaders(
                api_key=api_key,
                config=GATEWAY_CONFIG,
                metadata={
                    "feature": feature,
                    "_user": "rag-system",
                    "environment": "production"
                }
            )
        )

    from langchain_groq import ChatGroq
    return ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model=settings.GROQ_MODEL,
        temperature=0,
    )

def extract_cache_status(response) -> str:
    """
    Pull x-portkey-cache-status from the Portkey native client response headers.
    Tries multiple attribute paths defensively — returns 'MISS' if not found.
    """
    for attr in ("_raw_response", "_response", "_http_response"):
        raw = getattr(response, attr, None)
        if raw is not None:
            status = getattr(raw, "headers", {}).get("x-portkey-cache-status", "")
            if status:
                return status.upper()
    return "MISS"


def generate_completion(prompt: str, feature: str = "rag"):
    """
    Generates a completion using Portkey gateway if PORTKEY_API_KEY is configured.
    Otherwise falls back directly to Groq API.
    Returns (content, cache_status).
    """
    if settings.PORTKEY_API_KEY and settings.PORTKEY_API_KEY.strip():
        response = portkey_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1
        )
        content = response.choices[0].message.content
        cache_status = extract_cache_status(response)
        return content, cache_status

    from groq import Groq
    groq_client = Groq(api_key=settings.GROQ_API_KEY)
    response = groq_client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1
    )
    content = response.choices[0].message.content
    return content, "MISS"