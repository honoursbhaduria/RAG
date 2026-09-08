import logfire
from app.agents.state import AgentState
from app.services.retrieval.qdrant_service import search_enterprise_knowledge, get_document_chunks
from app.services.retrieval.ranking_service import rerank_documents

def retrieve_node(state: AgentState):
    """
    Performs vector search and semantic reranking for technical queries,
    with direct chunk resolution for uploaded documents.
    """
    query = state["current_query"]
    filename = state.get("filename")
    session_id = state.get("session_id")
    top_k = int(state.get("top_k") or 5)
    
    # Auto-detect resume if user asks about resume/experience but filename wasn't explicitly passed
    user_msg_text = state.get("messages", [])[-1]["content"] if state.get("messages") else query
    if not filename and any(w in (query + " " + user_msg_text).lower() for w in ["resume", "cv", "intern", "internship", "experience", "education", "who am i", "my work"]):
        found = get_document_chunks("resume", limit=5)
        if found:
            filename = found[0].get("source")
            logfire.info(f"Auto-detected active resume from vector store: '{filename}'")

    with logfire.span("🔍 Knowledge Retrieval"):
        # Case 1: Document Overview / Summary
        if query == "DOCUMENT_SUMMARY" or (filename and any(w in user_msg_text.lower() for w in ["summarize", "tell me about", "what is on", "who am i", "overview", "experience", "intern"])):
            logfire.info(f"Directly fetching all document chunks for '{filename}'")
            doc_chunks = get_document_chunks(filename=filename, session_id=session_id, limit=top_k * 3) if filename else []
            if not doc_chunks:
                doc_chunks = search_enterprise_knowledge(filename or query or "resume document overview", limit=top_k)
            
            formatted_docs = [
                f"SOURCE: {d.get('source', filename or 'Uploaded Document')}\nCONTENT: {d['content']}"
                for d in doc_chunks
            ]
            return {
                "documents": formatted_docs,
                "status": f"Loaded complete context from {filename or 'document'}.",
                "plan": state["plan"] + [f"Document Context Loaded: {filename or 'Uploaded Document'}"]
            }

        # Case 2: Specific Query
        logfire.info(f"Searching Qdrant for: {query}")
        raw_results = []
        
        # If an uploaded file is active, ALWAYS fetch its chunks first to guarantee context
        if filename:
            try:
                # 1. Direct document chunks (guarantees resume / doc facts are present)
                direct_chunks = get_document_chunks(filename=filename, session_id=session_id, limit=8)
                for d in direct_chunks:
                    raw_results.append(d)
                
                # 2. Look up chunks filtered by that file
                file_results = search_enterprise_knowledge(query, limit=10, filter_source=filename)
                for doc in file_results:
                    if not any(r['content'] == doc['content'] for r in raw_results):
                        raw_results.append(doc)
            except Exception as e:
                logfire.warning(f"File-targeted search error: {e}")

        # Search the broader enterprise knowledge base
        global_results = search_enterprise_knowledge(query, limit=10)
        for doc in global_results:
            if not any(r['content'] == doc['content'] for r in raw_results):
                raw_results.append(doc)

        logfire.info(f"Retrieved {len(raw_results)} total candidates from Vector DB")
        
        if not raw_results:
            return {
                "documents": [],
                "status": "No specific documents matched query.",
                "plan": state["plan"] + ["Context: None found (LLM knowledge fallback)"]
            }

        # If we have direct document chunks for an active file, prioritize them directly
        direct_doc_chunks = [r for r in raw_results if r.get('source') == filename]
        other_chunks = [r for r in raw_results if r.get('source') != filename]

        doc_contents = [doc['content'] for doc in other_chunks]
        reranked_contents = []
        if doc_contents:
            with logfire.span("⚖️ Semantic Reranking"):
                reranked_contents = rerank_documents(query, doc_contents, top_n=top_k)
                logfire.info(f"Reranking complete. Kept top {len(reranked_contents)} most relevant chunks.")
            
        formatted_docs = []
        # Prepend direct document chunks so LLM has 100% of resume/uploaded doc context
        for d in direct_doc_chunks:
            formatted_docs.append(f"SOURCE: {d.get('source', filename)}\nCONTENT: {d['content']}")

        for content in reranked_contents:
            if not any(content in fd for fd in formatted_docs):
                source_name = next((d.get('source') for d in raw_results if d.get('content') == content), "Knowledge Base")
                formatted_docs.append(f"SOURCE: {source_name}\nCONTENT: {content}")
    
    return {
        "documents": formatted_docs[:top_k * 2],
        "status": "Found technical context.",
        "plan": state["plan"] + ["Context Retrieved"]
    }
