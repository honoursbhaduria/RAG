import logfire
from app.agents.state import AgentState
from app.services.retrieval.qdrant_service import search_enterprise_knowledge
from app.services.retrieval.ranking_service import rerank_documents

def retrieve_node(state: AgentState):
    """
    Performs vector search and semantic reranking for technical queries and uploaded documents.
    """
    query = state["current_query"]
    filename = state.get("filename")
    
    with logfire.span("🔍 Knowledge Retrieval"):
        logfire.info(f"Searching Qdrant for: {query}")
        raw_results = search_enterprise_knowledge(query, limit=15)

        # If an uploaded file is active, ensure its chunks are queried and included
        if filename:
            try:
                file_results = search_enterprise_knowledge(f"{filename} {query}", limit=10)
                for doc in file_results:
                    if doc.get('source') == filename and not any(r['content'] == doc['content'] for r in raw_results):
                        raw_results.insert(0, doc)
            except Exception as e:
                logfire.warning(f"File-specific chunk lookup failed: {e}")

        logfire.info(f"Retrieved {len(raw_results)} candidates from Vector DB")
        
        doc_contents = [doc['content'] for doc in raw_results]
        
        top_k = int(state.get("top_k") or 5)
        with logfire.span("⚖️ Semantic Reranking"):
            reranked_contents = rerank_documents(query, doc_contents, top_n=top_k)
            logfire.info(f"Reranking complete. Kept top {len(reranked_contents)} most relevant chunks.")
            
        formatted_docs = []
        for content in reranked_contents:
            source_name = next((d.get('source') for d in raw_results if d.get('content') == content), filename or "Document")
            formatted_docs.append(f"SOURCE: {source_name}\nCONTENT: {content}")
    
    return {
        "documents": formatted_docs,
        "status": f"Found technical context.",
        "plan": state["plan"] + ["Context Retrieved"]
    }
