# ============================================================
# CRITICAL: logfire MUST be configured before ALL other imports
# so that spans from all modules are captured from the start.
# ============================================================
import logfire
import os
from dotenv import load_dotenv

load_dotenv()
logfire_token = os.getenv("LOGFIRE_TOKEN")
if logfire_token:
    logfire.configure(token=logfire_token, inspect_arguments=False)
else:
    logfire.configure(send_to_logfire=False, inspect_arguments=False)

# Now safe to import app modules - logfire is already active
from fastapi import FastAPI, Response, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from app.agents.graph import rag_agent
from app.guardrails import initialize_rails, guard
from app.services.code_service import generate_code_assistance
from app.services.document_service import process_and_ingest_uploaded_file

from pydantic import BaseModel, Field
from typing import Optional, List


# Initialize FastAPI with /api/docs
app = FastAPI(
    title="Enterprise Agentic RAG API",
    description="""
## Enterprise Agentic RAG System API Documentation

Welcome to the interactive API documentation. You can test endpoints directly using the **Try it out** button or copy the generated **cURL** command below.

### Available Endpoints:
- **`POST /query`**: Primary endpoint for querying the knowledge base with guardrails, multi-vector search, reranking, and synthesis.
- **`GET /health`**: Health check and status endpoint.
- **`GET /graph`**: Visual workflow graph in PNG format.
- **`GET /api/docs`**: This interactive Swagger documentation.
    """,
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    initialize_rails()
    try:
        from app.services.retrieval.embedding import _get_local
        _get_local()
        from app.services.retrieval.ranking_service import rerank_documents
        rerank_documents("warmup", ["warmup query context"], top_n=1)
        logfire.info("Models warmed up: embedding and reranking ready.")
    except Exception as e:
        logfire.warning(f"Startup warmup skipped: {e}")


@app.get("/docs", include_in_schema=False)
def redirect_to_api_docs():
    """Redirects default /docs to /api/docs."""
    return RedirectResponse(url="/api/docs")


class QueryRequest(BaseModel):
    q: str = Field(
        ...,
        description="The question or technical query for the enterprise knowledge base.",
        example="What is SRIOV and how is it used in networking?"
    )
    thread_id: Optional[str] = Field(
        default="default_user",
        description="Session or thread ID for conversational memory retention across turns.",
        example="session_user_01"
    )
    persona: Optional[str] = Field(
        default=None,
        description="Persona mode for the synthesis engine.",
        example="Enterprise Architect"
    )
    system_prompt: Optional[str] = Field(
        default=None,
        description="Custom system instruction addendum.",
        example="Focus on low-latency kernel and hardware bypass details."
    )
    temperature: Optional[float] = Field(
        default=0.1,
        description="LLM temperature (0.0 to 1.0).",
        example=0.1
    )
    top_k: Optional[int] = Field(
        default=5,
        description="Number of context chunks to rerank and keep.",
        example=5
    )
    filename: Optional[str] = Field(
        default=None,
        description="Optional filename of an uploaded document to prioritize in context.",
        example="architecture.pdf"
    )


class QueryResponse(BaseModel):
    question: str = Field(..., description="Original user question")
    answer: Optional[str] = Field(None, description="Synthesized answer from LLM or Guardrails")
    thought_process: List[str] = Field(default=[], description="Step-by-step reasoning and execution plan")
    status: Optional[str] = Field(None, description="Execution status of the pipeline")
    sources: List[str] = Field(default=[], description="Retrieved and reranked context chunks")


class CodeAssistRequest(BaseModel):
    prompt: str = Field(..., description="Coding question, debugging request, or optimization goal", example="Write a binary search algorithm")
    code: Optional[str] = Field(None, description="Optional existing code snippet to debug or refactor")
    language: Optional[str] = Field("python", description="Language: python or javascript")
    engine: Optional[str] = Field("groq", description="LLM Engine: groq or gemini")


class CodeAssistResponse(BaseModel):
    answer: str = Field(..., description="Explanation and full response")
    code: Optional[str] = Field(None, description="Extracted runnable code block")
    language: str = Field("python", description="Detected language")
    engine: str = Field("groq", description="Engine used")
    
    
@app.get("/", tags=["System"])
def home():
    """Service status and link to interactive API docs."""
    return {
        "message": "Enterprise LangGraph RAG API is live.",
        "docs": "/api/docs"
    }


@app.get("/health", tags=["System"])
def health():
    """Health check endpoint for Kubernetes, Docker, and monitoring."""
    return {
        "status": "healthy",
        "service": "Enterprise Agentic RAG API",
        "docs": "/api/docs"
    }


@app.get("/graph", tags=["Agent Workflow"])
def get_graph_image():
    """
    Returns the Mermaid image of the agent's workflow graph.
    """
    try:
        png_bytes = rag_agent.get_graph().draw_mermaid_png()
        return Response(content=png_bytes, media_type="image/png")
    except Exception as e:
        return {"error": f"Could not generate graph image: {e}"}
    
    
SESSION_ACTIVE_DOCS: dict[str, str] = {}


@app.post(
    "/query",
    response_model=QueryResponse,
    tags=["Agentic RAG"],
    summary="Execute Enterprise RAG Query",
    description="""
Executes the full LangGraph RAG flow with memory, NeMo Guardrails, multi-vector Qdrant retrieval, and FlashRank cross-encoder reranking.

**Example cURL:**
```bash
curl -X POST "http://localhost:8000/query" \\
  -H "Content-Type: application/json" \\
  -d '{"q": "What is SRIOV and how is it used in networking?", "thread_id": "session_user_01"}'
```
"""
)
def query(request: QueryRequest):
    """
    Executes the LangGraph RAG flow with memory using a POST request.
    """
    q = request.q
    thread_id = request.thread_id or "default_user"

    # Resolve active uploaded document (from request, current thread, or latest upload)
    q_lower = q.lower()
    doc_keywords = ["resume", "cv", "intern", "internship", "experience", "education", "profile", "document", "pdf", "file", "upload", "who am i", "my work", "about me"]
    is_doc_query = any(k in q_lower for k in doc_keywords)

    effective_filename = (
        request.filename
        or SESSION_ACTIVE_DOCS.get(thread_id)
        or SESSION_ACTIVE_DOCS.get("default_user")
        or (SESSION_ACTIVE_DOCS.get("_latest") if is_doc_query else None)
    )

    if effective_filename:
        SESSION_ACTIVE_DOCS[thread_id] = effective_filename

    initial_state = {
        "messages": [{"role": "user", "content": q}],
        "current_query": q,
        "documents": [],
        "plan": ["Start"],
        "status": "Initializing Graph...",
        "persona": request.persona,
        "system_prompt": request.system_prompt,
        "temperature": request.temperature if request.temperature is not None else 0.1,
        "top_k": request.top_k if request.top_k is not None else 5,
        "filename": effective_filename,
        "session_id": thread_id,
    }
    
    # Configuration for Memory (Thread ID)
    config = {"configurable": {"thread_id": thread_id}}
    
    try:
        # Gate 1: NeMo Guardrails — blocks overt prompt injection, XSS script tags, and malicious jailbreaks
        rail_fired, rail_response = guard(q)
        if rail_fired:
            logfire.info(f"Request blocked by guardrails | thread={thread_id}")
            return {
                "question": q,
                "answer": rail_response,
                "thought_process": ["Intent: Security Gate Triggered", "Action: Zero-Trust Interception", "Retrieval: Skipped"],
                "status": "Blocked by guardrails.",
                "sources": []
            }

        # Gate 2: LangGraph RAG pipeline
        # Run the graph synchronously to preserve Logfire context variables
        final_output = rag_agent.invoke(initial_state, config=config)

        raw_docs = final_output.get("documents", [])
        extracted_sources = []
        for d in raw_docs:
            if isinstance(d, str) and d.startswith("SOURCE: "):
                src = d.split("\n")[0].replace("SOURCE: ", "").strip()
                if src and src not in extracted_sources:
                    extracted_sources.append(src)
            elif isinstance(d, dict) and "source" in d:
                src = d["source"]
                if src and src not in extracted_sources:
                    extracted_sources.append(src)
        if effective_filename and effective_filename not in extracted_sources:
            extracted_sources.insert(0, effective_filename)
        if not extracted_sources and raw_docs:
            extracted_sources = [d[:80] + "..." if len(d) > 80 else d for d in raw_docs[:3]]
        
        return {
            "question": q,
            "answer": final_output.get("final_answer"),
            "thought_process": final_output.get("plan"),
            "status": final_output.get("status"),
            "sources": extracted_sources
        }
    except Exception as e:
        logfire.error(f"Backend Execution Failed: {e}")
        return {
            "question": q,
            "answer": "I apologize, but I encountered an internal error while processing your request. Please try again later.",
            "thought_process": ["Error encountered during execution."],
            "status": "error",
            "sources": []
        }


@app.post(
    "/code/assist",
    response_model=CodeAssistResponse,
    tags=["Code Studio"],
    summary="AI Code Copilot (Groq & Gemini)",
    description="Generates, explains, and debugs code using Groq or Gemini with automatic runnable code extraction."
)
def code_assist(request: CodeAssistRequest):
    """
    Executes specialized coding copilot generation using Groq or Gemini.
    Protected by NeMo & Regex Security Gate to prevent prompt injection and script payloads.
    """
    rail_fired, rail_response = guard(request.prompt)
    if rail_fired:
        return {
            "answer": rail_response or "Security Guardrail Alert: Request blocked by safety guidelines.",
            "code": None,
            "language": request.language or "python",
            "engine": "guardrails-shield"
        }

    answer, code, lang, engine_used = generate_code_assistance(
        prompt=request.prompt,
        code_context=request.code,
        language=request.language or "python",
        engine=request.engine or "groq"
    )
    return {
        "answer": answer,
        "code": code,
        "language": lang,
        "engine": engine_used
    }


class UploadFileResponse(BaseModel):
    success: bool = Field(..., description="Whether file passed guardrails and was successfully indexed")
    status: str = Field(..., description="Status: indexed, blocked, empty, or error")
    safe: bool = Field(..., description="Whether document passed security guardrails")
    filename: str = Field(..., description="Name of the processed file")
    session_id: Optional[str] = Field(None, description="Session or conversation ID associated with the uploaded file")
    chunks_count: Optional[int] = Field(None, description="Number of text chunks extracted")
    points_indexed: Optional[int] = Field(None, description="Number of vector points upserted to Qdrant")
    preview: Optional[str] = Field(None, description="Document preview excerpt")
    guardrail_status: Optional[str] = Field(None, description="Status from NeMo Guardrails")
    message: Optional[str] = Field(None, description="Detailed status message")
    reason: Optional[str] = Field(None, description="Rejection reason if blocked")


@app.post(
    "/upload",
    response_model=UploadFileResponse,
    tags=["Ingestion & Guardrails"],
    summary="Upload Document with Guardrails Validation & RAG Ingestion",
    description="Validates uploaded documents against NeMo Guardrails and injection attacks, chunks content, embeds using dual vectors, and indexes into Qdrant."
)
async def upload_document(
    file: UploadFile = File(...),
    session_id: Optional[str] = Form(None)
):
    """
    Upload a document (PDF, TXT, MD, Python, JSON, HTML, etc.).
    The file first passes through safety guardrails. If safe, it is ingested into the RAG vector store with session metadata.
    """
    content = await file.read()
    result = process_and_ingest_uploaded_file(content, file.filename, session_id=session_id)
    if result.get("success"):
        key = session_id or "default_user"
        SESSION_ACTIVE_DOCS[key] = file.filename
        SESSION_ACTIVE_DOCS["_latest"] = file.filename
    return result
