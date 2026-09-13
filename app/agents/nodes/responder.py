import logfire
from app.agents.state import AgentState
from app.gateway.client import generate_completion


def generate_node(state: AgentState):
    """
    Synthesizes a response using both Documentation Context AND Conversation History.
    Uses Portkey gateway or fallback Groq LLM completion.
    """
    query = state["current_query"]

    history_str = ""
    for msg in state["messages"][:-1]:
        role = "User" if msg["role"] == "user" else "Assistant"
        history_str += f"{role}: {msg['content']}\n"

    user_msg = state["messages"][-1]["content"] if state["messages"] else ""

    persona = state.get("persona") or "Senior Technical Architect"
    system_instruction = state.get("system_prompt") or ""
    temp = float(state.get("temperature", 0.1))

    if query == "CONVERSATIONAL":
        logfire.info(f"Generating conversational response ({persona}).")
        prompt = f"""
        You are an expert {persona}.
        {system_instruction}
        Answer the user's latest message using the CONVERSATION HISTORY below.

        CONVERSATION HISTORY:
        {history_str}

        LATEST MESSAGE:
        "{user_msg}"
        """
    else:
        logfire.info(f"Generating technical RAG response ({persona}).")
        max_context_chars = 14000
        full_context = ""

        for doc in state["documents"]:
            if len(full_context) + len(doc) < max_context_chars:
                full_context += doc + "\n\n"
            else:
                logfire.warning("Context truncated to fit Groq TPM limits.")
                break

        filename = state.get("filename")
        doc_header = f"ACTIVE ATTACHED DOCUMENT: {filename}\n" if filename else ""

        prompt = f"""
        You are an expert {persona}.
        {system_instruction}

        {doc_header}
        CONTEXT & DOCUMENTATION:
        {full_context if full_context.strip() else "(No specific internal document context found for this query)"}

        CONVERSATION HISTORY:
        {history_str}

        USER QUESTION:
        "{user_msg}"

        INSTRUCTIONS:
        1. If the user question pertains to their resume, internship, work experience, education, skills, projects, or uploaded document, extract and present the EXACT facts, names, dates, companies (e.g. internships, roles, technologies, institutions, CGPA) from the CONTEXT above. Do not claim you don't have access when the context is provided.
        2. If the user asks to summarize or explain the uploaded document or resume, provide a well-structured summary covering education, experience, technical skills, and key projects.
        3. If the user asks a question from outside the uploaded document or knowledge base (e.g. general technical concepts, math, coding, or facts not in the file), answer helpfully, accurately, and comprehensively using your broader knowledge base, clearly noting that the answer is based on general technical knowledge.
        """

    with logfire.span("LLM Synthesis"):
        try:
            content, cache_status = generate_completion(prompt, temperature=temp)
            is_cache_hit = cache_status == "HIT"

            if is_cache_hit:
                logfire.info("Gateway Cache Hit — response served from Portkey cache.")
                plan_update = state["plan"] + ["Cache: Hit (Portkey)"]
                status = "Cache hit — instant response."
            else:
                logfire.info("Response synthesised via LLM.")
                plan_update = state["plan"]
                status = "Response generated."

            return {
                "final_answer": content,
                "status": status,
                "plan": plan_update,
                "messages": [{"role": "assistant", "content": content}]
            }

        except Exception as e:
            logfire.error(f"LLM Generation failed: {e}")
            raise e
