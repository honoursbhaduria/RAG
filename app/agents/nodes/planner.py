from app.agents.state import AgentState
from app.gateway import get_langchain_llm
import logfire

# Portkey-backed LLM: fallback + cache + retry — same .invoke() interface as ChatGroq
llm = get_langchain_llm(feature="planner")

def planner_node(state: AgentState):
    """
    The Planner determines if a search is needed based on the ENTIRE conversation
    and any active uploaded document.
    """
    history = ""
    for msg in state.get("messages", [])[:-1]:
        role = "User" if msg.get("role") == "user" else "Assistant"
        history += f"{role}: {msg.get('content', '')}\n"
    
    user_message = state.get("messages", [])[-1]["content"] if state.get("messages") else ""
    filenames = state.get("filenames") or ([state.get("filename")] if state.get("filename") else [])
    filename = filenames[0] if filenames else None
    
    if filenames:
        doc_info = f"ACTIVE ATTACHED DOCUMENTS ({len(filenames)}): {', '.join(filenames)}\n"
    else:
        doc_info = "NO DOCUMENTS ATTACHED.\n"
    
    user_msg_stripped = user_message.strip().lower()
    has_docs = bool(filenames)
    is_pure_greeting = user_msg_stripped in ["hi", "hello", "hey", "good morning", "good evening", "thanks", "thank you", "bye"]

    file_inquiry_phrases = [
        "what file", "which file", "what document", "which document",
        "show file", "list file", "saved file", "uploaded file",
        "attached file", "my file", "what did i upload", "files saved",
        "files attached", "files in this chat", "show what file",
        "show files", "saved files", "what have you saved", "stored file", "stared file"
    ]
    is_file_inquiry = any(phrase in user_msg_stripped for phrase in file_inquiry_phrases)

    if is_file_inquiry:
        files_label = f"{len(filenames)} document(s): {', '.join(filenames)}" if filenames else "no attached documents"
        logfire.info(f"Planner recognized saved files inquiry: {files_label}")
        return {
            "current_query": "FILES_INQUIRY",
            "is_document_query": True,
            "status": f"Listing saved files for this session ({files_label})...",
            "plan": ["Intent: Saved Files Inquiry", f"Session Files: {files_label}"]
        }

    prompt = f"""
    You are an intelligent Assistant Planner in an Enterprise RAG and Multi-Document Q&A system.
    Analyze the conversation history, the active attached documents in this chat session, and the user's latest message.

    {doc_info}
    CONVERSATION HISTORY:
    {history}

    LATEST MESSAGE:
    "{user_message}"

    Rules:
    1. If documents ARE attached to this session:
       - If the user asks for a summary, overview, or asks what is in the document(s), output 'DOCUMENT_SUMMARY'.
       - If the user asks what files are saved, attached, or uploaded, output 'FILES_INQUIRY'.
       - If the user asks any substantive question, technical question, or asks about content/data in the files, formulate a concise, keyword-rich search query to retrieve the relevant sections.
       - ONLY output 'CONVERSATIONAL' if the message is a trivial greeting with no question.
    2. If NO documents are attached to this session:
       - If the user asks what files are saved or uploaded, output 'FILES_INQUIRY'.
       - If the user asks a technical, architectural, or knowledge question, formulate an optimal search query.
       - If the message is a greeting or general conversational remark, output 'CONVERSATIONAL'.

    Output ONLY 'CONVERSATIONAL', 'DOCUMENT_SUMMARY', 'FILES_INQUIRY', or the optimal search query string with no explanation.
    """

    with logfire.span("🧠 Planner Decision"):
        decision = llm.invoke(prompt).content.strip()
        decision = decision.strip('"`\'')
        logfire.info(f"Intent identified: {decision}")

    if "FILES_INQUIRY" in decision:
        files_label = f"{len(filenames)} document(s): {', '.join(filenames)}" if filenames else "no attached documents"
        return {
            "current_query": "FILES_INQUIRY",
            "is_document_query": True,
            "status": f"Listing saved files for this session ({files_label})...",
            "plan": ["Intent: Saved Files Inquiry", f"Session Files: {files_label}"]
        }

    # Safety guard: if documents are attached and user asked a non-greeting, never fall back to conversational
    if has_docs and not is_pure_greeting and (decision == "CONVERSATIONAL" or "CONVERSATIONAL" in decision):
        logfire.info(f"Correcting planner CONVERSATIONAL intent to document retrieval for active files: {filenames}")
        decision = user_message

    if decision == "CONVERSATIONAL":
        return {
            "current_query": "CONVERSATIONAL",
            "is_document_query": False,
            "status": "Handling conversationally (using memory)...",
            "plan": ["Intent: Conversational/Memory", "Retrieval: Skipped"]
        }
    elif decision == "DOCUMENT_SUMMARY" or "DOCUMENT_SUMMARY" in decision:
        files_label = f"{len(filenames)} document(s): {', '.join(filenames)}" if filenames else "uploaded document"
        return {
            "current_query": "DOCUMENT_SUMMARY",
            "is_document_query": True,
            "status": f"Generating document summary for {files_label}...",
            "plan": ["Intent: Document Summary", f"Target: {files_label}"]
        }

    return {
        "current_query": decision,
        "is_document_query": has_docs,
        "status": f"Research needed. Searching for: {decision}",
        "plan": ["Intent: Query", f"Search Term: {decision}"]
    }
