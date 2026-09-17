import logfire
from app.agents.state import AgentState
from app.services.retrieval.qdrant_service import (
    search_session_documents,
    get_session_chunks,
    search_enterprise_knowledge,
)
from app.services.retrieval.ranking_service import rerank_documents


def retrieve_node(state: AgentState):
    """
    Performs pure session-isolated vector search and semantic reranking.
    Documents uploaded to this chat session (session_id) are searched with high priority.
    Zero cross-session data leakage: other chat sessions have different session_ids.
    """
    query = state["current_query"]
    session_id = state.get("session_id")
    filenames = state.get("filenames") or ([state.get("filename")] if state.get("filename") else [])
    top_k = int(state.get("top_k") or 5)

    with logfire.span("🔍 Knowledge Retrieval", session_id=session_id, query=query):
        raw_results = []
        is_summary = (query == "DOCUMENT_SUMMARY")

        # 1. If this session has uploaded documents, query exclusively within this session
        if session_id:
            # Case A: User asks for a complete summary / overview of uploaded documents
            if is_summary:
                logfire.info(f"Fetching complete document context for session '{session_id}'")
                session_chunks = get_session_chunks(
                    session_id=session_id,
                    limit=top_k * 4,
                    filter_sources=filenames if filenames else None
                )
                raw_results.extend(session_chunks)
            else:
                # Case B: Semantic vector search strictly within this chat's uploaded documents
                session_vector_results = search_session_documents(
                    query=query,
                    session_id=session_id,
                    limit=top_k * 2,
                    filter_sources=filenames if filenames else None
                )
                raw_results.extend(session_vector_results)

                # If few semantic matches found, supplement with top session chunks
                if len(raw_results) < 3 and filenames:
                    fallback_session_chunks = get_session_chunks(
                        session_id=session_id,
                        limit=top_k,
                        filter_sources=filenames
                    )
                    for chunk in fallback_session_chunks:
                        if not any(r.get("content") == chunk.get("content") for r in raw_results):
                            raw_results.append(chunk)

        # 2. If the chat session has no uploaded documents, search the general enterprise knowledge base
        if not raw_results:
            logfire.info(f"No session documents found; searching general knowledge base for: {query}")
            global_results = search_enterprise_knowledge(query, limit=top_k * 2)
            raw_results.extend(global_results)

        if not raw_results:
            return {
                "documents": [],
                "status": "No relevant documents found.",
                "plan": state["plan"] + ["Context: None found (LLM general knowledge fallback)"]
            }

        # 3. Rerank the candidate chunks using FlashRank cross-encoder
        doc_contents = [r["content"] for r in raw_results if r.get("content")]
        reranked_contents = []
        if doc_contents:
            with logfire.span("⚖️ Semantic Reranking"):
                reranked_contents = rerank_documents(query, doc_contents, top_n=top_k)
                logfire.info(f"Reranking complete. Kept top {len(reranked_contents)} chunks.")

        formatted_docs = []
        for content in reranked_contents:
            source_name = next(
                (r.get("source") for r in raw_results if r.get("content") == content),
                "Uploaded Document" if session_id else "Knowledge Base"
            )
            formatted_docs.append(f"SOURCE: {source_name}\nCONTENT: {content}")

        # Fallback if reranker yielded empty
        if not formatted_docs and raw_results:
            for r in raw_results[:top_k]:
                source_name = r.get("source", "Uploaded Document")
                formatted_docs.append(f"SOURCE: {source_name}\nCONTENT: {r.get('content', '')}")

        return {
            "documents": formatted_docs,
            "status": f"Retrieved {len(formatted_docs)} relevant context chunk(s).",
            "plan": state["plan"] + [f"Context Retrieved ({len(formatted_docs)} chunks)"]
        }
