import logfire
from langchain_groq import ChatGroq
from nemoguardrails import RailsConfig, LLMRails

from app.config import settings
from app.guardrails.colang_rules import COLANG_CONTENT, YAML_CONTENT, RAIL_INDICATORS


_rails: LLMRails | None = None


def initialize_rails() -> None:
    """
    Build the NeMo LLMRails singleton at app startup.
    Uses llama-3.1-8b-instant for fast intent classification at the gate —
    the heavier llama-3.3-70b-versatile is reserved for the RAG pipeline.
    """
    global _rails

    guard_llm = ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model=settings.GROQ_FALLBACK_MODEL,
        temperature=0
    )

    config = RailsConfig.from_content(
        colang_content=COLANG_CONTENT,
        yaml_content=YAML_CONTENT
    )

    _rails = LLMRails(config, llm=guard_llm)
    logfire.info(f"🛡️ NeMo Guardrails initialised ({settings.GROQ_FALLBACK_MODEL}).")
    
    


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
]


def guard(message: str) -> tuple[bool, str | None]:
    """
    Run a user message through the NeMo rails gate and safety heuristic filter.

    Returns:
        (True,  rail_response) — a rail fired; return this response immediately,
                                skip the RAG pipeline entirely.
        (False, None)          — message is clean; proceed to LangGraph.
    """
    import re
    msg_lower = message.lower()

    # Fast-path pattern gate for overt jailbreaks and injection attempts
    for pattern in JAILBREAK_PATTERNS:
        if re.search(pattern, msg_lower):
            logfire.info(f"Guardrail triggered via jailbreak pattern | query='{message[:80]}'")
            return True, "I maintain consistent guidelines regardless of how I am prompted. I am here to help with Kubernetes, Intel, and networking. What can I help you with?"

    if _rails is None:
        logfire.warning("Guardrails not initialised — skipping gate.")
        return False, None

    with logfire.span("Guardrails Check"):
        result = _rails.generate(messages=[{"role": "user", "content": message}])

        # NeMo returns {'role': 'assistant', 'content': '...'} — extract text
        content = result.get("content", "") if isinstance(result, dict) else str(result)

        refusal_indicators = [
            *RAIL_INDICATORS,
            "can't comply with that",
            "cannot comply with that",
            "refuse to comply",
            "cannot bypass",
            "I'm sorry, but I can't",
            "I cannot fulfill this request"
        ]

        fired = any(indicator in content for indicator in refusal_indicators)

        if fired:
            # Clean off any <think> reasoning tags from response if present
            clean_content = re.sub(r"<think>.*?</think>", "", content, flags=re.DOTALL).strip()
            logfire.info(f"Guardrails fired | query='{message[:80]}'")
            return True, clean_content or "I maintain consistent guidelines regardless of how I am prompted. I am here to help with Kubernetes, Intel, and networking."

        logfire.info("Guardrails passed.")
        return False, None
