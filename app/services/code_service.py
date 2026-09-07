import re
import os
import logfire
from typing import Tuple, Optional
from app.config import settings
from app.gateway.client import generate_completion


CODING_SYSTEM_PROMPT = """You are an expert Senior Software Engineer and Coding Copilot.
Your job is to provide clean, bug-free, production-ready, and directly RUNNABLE code.

Guidelines:
1. Always format code in proper fenced code blocks with language identifier (e.g. ```python or ```javascript).
2. Ensure the code includes a complete, runnable example with sample inputs and print/console output so the user can click 'Run Code' and see immediate results.
3. Keep the explanation clear, focused, and concise.
4. If the user asks to debug or optimize existing code, explain the fix and provide the corrected runnable version.
"""


def _extract_code_block(text: str, default_lang: str = "python") -> Tuple[str, str]:
    """
    Extracts the first code block from markdown text along with its language.
    Returns (extracted_code, language).
    """
    pattern = r"```([a-zA-Z0-9_-]*)\n([\s\S]*?)```"
    match = re.search(pattern, text)
    if match:
        lang = match.group(1).strip().lower() or default_lang
        code = match.group(2).strip()
        return code, lang
    return "", default_lang


def generate_code_assistance(
    prompt: str,
    code_context: Optional[str] = None,
    language: str = "python",
    engine: str = "groq"
) -> Tuple[str, str, str, str]:
    """
    Generates code assistance using either Groq or Gemini.
    Returns (answer_markdown, extracted_code, language, engine_used).
    """
    lang = (language or "python").lower()
    selected_engine = (engine or "groq").lower()

    user_content = f"Language: {lang}\n"
    if code_context and code_context.strip():
        user_content += f"Existing Code:\n```{lang}\n{code_context}\n```\n\n"
    user_content += f"User Request: {prompt}"

    full_prompt = f"{CODING_SYSTEM_PROMPT}\n\n{user_content}"

    # Try Gemini if requested
    if selected_engine == "gemini":
        gemini_key = os.getenv("GEMINI_API_KEY")
        if gemini_key:
            try:
                with logfire.span("Gemini Code Generation"):
                    from google import genai
                    client = genai.Client(api_key=gemini_key)
                    response = client.models.generate_content(
                        model="gemini-2.5-flash",
                        contents=full_prompt
                    )
                    raw_text = response.text or ""
                    extracted_code, detected_lang = _extract_code_block(raw_text, default_lang=lang)
                    return raw_text, extracted_code, detected_lang, "gemini"
            except Exception as e:
                logfire.warning(f"Gemini code generation failed: {e}. Falling back to Groq.")

    # Groq (Default or Fallback)
    with logfire.span("Groq Code Generation"):
        raw_text, _ = generate_completion(full_prompt, temperature=0.2)
        extracted_code, detected_lang = _extract_code_block(raw_text, default_lang=lang)
        return raw_text, extracted_code, detected_lang, "groq"
