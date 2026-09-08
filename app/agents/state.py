from typing import TypedDict, List, Annotated
import operator


class AgentState(TypedDict, total=False):
    # Using Annotated with operator.add ensures that messages 
    # are appended to the history rather than replaced.
    messages: Annotated[List[dict], operator.add]
    current_query: str
    documents: List[str]
    plan: List[str]
    status: str
    final_answer: str
    persona: str
    system_prompt: str
    temperature: float
    top_k: int
    filename: str
    session_id: str
    is_document_query: bool
