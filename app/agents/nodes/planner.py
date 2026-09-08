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
    filename = state.get("filename")
    
    doc_info = f"ACTIVE ATTACHED DOCUMENT: {filename}\n" if filename else "NO DOCUMENT ATTACHED.\n"
    
    user_msg_lower = user_message.lower().strip()
    doc_keywords = ["resume", "cv", "intern", "internship", "experience", "education", "skill", "project", "document", "pdf", "file", "upload", "who am i", "about me", "my work", "background"]
    is_doc_intent = any(k in user_msg_lower for k in doc_keywords) or bool(filename)

    prompt = f"""
    You are an intelligent Assistant Planner in an Enterprise RAG and Document Q&A system.
    Analyze the conversation history, the active attached document, and the latest user message.
    
    {doc_info}
    CONVERSATION HISTORY:
    {history}
    
    LATEST MESSAGE:
    "{user_message}"
    
    Task:
    1. If the user asks about their resume, CV, internships, work experience, education, projects, skills, or asking about an uploaded document, respond with 'DOCUMENT_SUMMARY' or an optimal search query. DO NOT respond with 'CONVERSATIONAL'.
    2. If the user asks to summarize, explain, or give an overview of the attached document (e.g. "summarize the PDF", "what is this file about?", "tell me about my resume"), respond with 'DOCUMENT_SUMMARY'.
    3. If the user asks a technical question, code request, architecture query, or a specific question about the document or general topics, output an optimal, keyword-rich search query.
    4. ONLY respond with 'CONVERSATIONAL' if the message is purely a brief greeting with no questions (e.g. "hi", "hello", "thanks").
    
    Output ONLY 'CONVERSATIONAL', 'DOCUMENT_SUMMARY', or the search query.
    """
    
    with logfire.span("🧠 Planner Decision"):
        decision = llm.invoke(prompt).content.strip()
        # Clean any surrounding quotes or backticks
        decision = decision.strip('"`\'')
        logfire.info(f"Intent identified: {decision}")

    # Safety override: never treat document or resume queries as conversational
    if (decision == "CONVERSATIONAL" or "CONVERSATIONAL" in decision) and is_doc_intent:
        logfire.info(f"Overriding CONVERSATIONAL to document retrieval for query: {user_message}")
        if any(w in user_msg_lower for w in ["summarize", "tell me about", "overview", "who am i", "my resume", "what is on"]):
            decision = "DOCUMENT_SUMMARY"
        else:
            decision = f"{filename or 'resume'} {user_message}"
    
    if decision == "CONVERSATIONAL":
        return {
            "current_query": "CONVERSATIONAL",
            "is_document_query": False,
            "status": "Handling conversationally (using memory)...",
            "plan": ["Intent: Conversational/Memory", "Retrieval: Skipped"]
        }
    elif decision == "DOCUMENT_SUMMARY" or "DOCUMENT_SUMMARY" in decision:
        return {
            "current_query": "DOCUMENT_SUMMARY",
            "is_document_query": True,
            "status": f"Generating document summary for {filename or 'uploaded document'}...",
            "plan": ["Intent: Document Summary", f"Target File: {filename or 'Active Document'}"]
        }
    
    is_doc = bool(filename or is_doc_intent)
    return {
        "current_query": decision,
        "is_document_query": is_doc,
        "status": f"Research needed. Searching for: {decision}",
        "plan": ["Intent: Query", f"Search Term: {decision}"]
    }
