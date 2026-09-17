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
    filenames = state.get("filenames") or ([state.get("filename")] if state.get("filename") else [])

    if query == "FILES_INQUIRY":
        logfire.info(f"Answering saved files inquiry with {len(filenames)} files.")
        if filenames:
            items = []
            for i, fn in enumerate(filenames, 1):
                ext = fn.split('.')[-1].upper() if '.' in fn else 'FILE'
                items.append(f"{i}. **`{fn}`** (`{ext}` Document) — Indexed in Qdrant & ready for questions")
            items_str = "\n".join(items)
            content = (
                f"### 📂 Attached Files in this Chat ({len(filenames)}/5)\n\n"
                f"The following **{len(filenames)} document(s)** are currently saved in this chat session's knowledge context:\n\n"
                f"{items_str}\n\n"
                f"> 💡 **Tip**: You can ask questions about any specific file, request a full summary, or ask comparative questions across all attached documents."
            )
        else:
            content = (
                "### 📂 No Files Currently Saved in this Chat\n\n"
                "There are no documents attached to this chat session yet.\n\n"
                "You can upload up to **5 documents** (PDF, Word, PPTX, TXT, Markdown, Python, CSV, SQL, etc.) using the upload button or dropzone to chat with your files."
            )
        return {
            "final_answer": content,
            "status": "Saved files listed.",
            "plan": state["plan"] + ["Response: Active Files Listed"],
            "messages": [{"role": "assistant", "content": content}]
        }

    if query == "CONVERSATIONAL":
        logfire.info(f"Generating conversational response ({persona}).")
        prompt = f"""
        You are an expert {persona}.
        {system_instruction}
        Answer the user's latest message using the CONVERSATION HISTORY below to maintain complete conversational context.

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

        if filenames:
            doc_header = f"ACTIVE ATTACHED DOCUMENTS ({len(filenames)}): {', '.join(filenames)}\n"
        else:
            doc_header = ""

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
        1. When CONTEXT & DOCUMENTATION is provided from uploaded document(s), answer directly, factually, and accurately using the information in that context. Extract and present the exact facts, figures, technical terms, and data points from the provided context. When multiple source documents are present, attribute facts to their respective source file names.
        2. Seamlessly complete context across conversation turns: read the CONVERSATION HISTORY carefully to resolve pronouns, references to previous answers, and follow-up requests (e.g. 'explain more', 'what about the second point', 'compare that').
        3. If the user asks to summarize or explain the uploaded document(s), provide a well-structured, comprehensive summary highlighting the core contents, key sections, and significant findings or details.
        4. If the answer cannot be found in the provided document context or if the user asks a general question, answer helpfully and accurately using your broader technical knowledge, clearly indicating whether information comes from the attached files or general knowledge.
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
