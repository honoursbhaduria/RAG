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
    r"reveal\s+(your\s+)?(secret\s+|system\s+)?(prompt|keys|tokens|credentials)",
    r"exfiltrate\s+(all\s+)?(environment|api_key|database)",
]

# Patterns detecting XSS, script injection, and destructive command execution
SCRIPT_INJECTION_PATTERNS = [
    r"<\s*script\b[^>]*>",
    r"<\s*/\s*script\s*>",
    r"javascript\s*:",
    r"vbscript\s*:",
    r"data\s*:\s*text/html",
    r"<\s*iframe\b[^>]*>",
    r"<\s*object\b[^>]*>",
    r"<\s*embed\b[^>]*>",
    r"<\s*(?:svg|img|body|input|div|a)\b[^>]*\bon(?:error|load|click|mouseover|submit|focus|blur)\s*=",
    r"\bon(?:error|load|click|mouseover|submit|keydown|focus|blur)\s*=\s*['\"][^'\"]*['\"]",
    r"document\.(?:cookie|location|write|domain)",
    r"window\.(?:location|navigate|open)\b",
    r"(?:curl|wget)\s+https?://[^\s|;]+\s*\|\s*(?:bash|sh|python)",
    r"/bin/(?:ba)?sh\s+-i",
    r"nc\s+-[a-zA-Z0-9]*e\s+/bin/",
    r"rm\s+-rf\s+[/~]",
    r"__import__\s*\(\s*['\"](?:os|subprocess|sys|shutil|pty)['\"]\s*\)\.(?:system|popen|call)",
    r"pty\.spawn\s*\(",
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

    # 1. Fast-path pattern gate for script injection & XSS attempts (<1ms)
    for pattern in SCRIPT_INJECTION_PATTERNS:
        if re.search(pattern, message, re.IGNORECASE):
            logfire.warning(f"Guardrail triggered via script injection pattern | match='{pattern}' | query='{message[:80]}'")
            return True, "Security Guardrail Alert: Potential script injection or unsafe executable code pattern detected and intercepted. Please submit a valid technical inquiry."

    # 2. Fast-path pattern gate for overt jailbreaks and injection attempts (<1ms)
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
