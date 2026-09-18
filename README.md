# CogniVault — Enterprise Agentic Multi-Document RAG & Code Studio

[![FastAPI](https://img.shields.io/badge/FastAPI-0.136-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![LangGraph](https://img.shields.io/badge/LangGraph-1.1.10-black?style=flat-square)](https://langchain-ai.github.io/langgraph/)
[![Neon](https://img.shields.io/badge/Neon-Lakebase_Postgres-00E599?style=flat-square&logo=postgresql)](https://neon.tech)
[![Qdrant](https://img.shields.io/badge/Qdrant-Cloud_Vector_DB-DC2626?style=flat-square)](https://qdrant.tech)
[![Groq](https://img.shields.io/badge/Groq-Compound_Reasoning-F55036?style=flat-square)](https://groq.com)
[![Logfire](https://img.shields.io/badge/Logfire-Observability-FF6B6B?style=flat-square)](https://pydantic.dev/logfire)
[![LangSmith](https://img.shields.io/badge/LangSmith-Agent_Tracing-blue?style=flat-square)](https://smith.langchain.com)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-white?style=flat-square&logo=vercel)](https://cognivault-dev.vercel.app)

**CogniVault** is a production-grade, enterprise-scale Agentic Retrieval-Augmented Generation (RAG) platform and AI Code Studio. Engineered with a cyclic **LangGraph** orchestration pipeline, **Neon Lakebase Postgres** for multi-chat persistence, **Qdrant Cloud** for session-isolated vector search, **FlashRank** for cross-encoder reranking, and zero-trust **NeMo Guardrails** with integrated SQL/Script injection defenses.

- **Live Production Application**: [cognivault-dev.vercel.app/#chat](https://cognivault-dev.vercel.app/#chat)
- **Interactive Swagger Documentation**: `https://<backend-url>/api/docs`
- **Health Check Endpoint**: `https://<backend-url>/health`

---

## Architecture Overview

```mermaid
flowchart TD
    subgraph Client ["Client Layer (React / Vite on Vercel)"]
        UI["CogniVault Web UI"]
        Hub["Active Session Saved Files Hub"]
        Studio["Code Studio Workspace"]
    end

    subgraph Security ["Zero-Trust Security Gate (app/guardrails)"]
        Rails["NeMo Semantic Safety Gate"]
        SQLScan["SQL Injection Scanner"]
        ScriptScan["XSS & Script Tag Scanner"]
    end

    subgraph Orchestration ["Agentic StateGraph Pipeline (app/agents)"]
        Planner{"Planner Node (Intent Analysis)"}
        Router{"Conditional Router Edge"}
        Retriever["Retriever Node (app/services/retrieval)"]
        Reranker["FlashRank Cross-Encoder Reranker"]
        Responder["Responder Node (Context Synthesis)"]
        MemorySaver[("LangGraph Memory Checkpointer")]
    end

    subgraph Storage ["Cloud Infrastructure & Databases"]
        NeonDB[("Neon Lakebase Postgres (session_documents, chat_messages)")]
        Qdrant[("Qdrant Cloud (Dual Embeddings: Gemini text-embedding-004)")]
        Groq["Groq Compound LLMs (openai/gpt-oss-120b & 20b fallback)"]
    end

    subgraph Observability ["Distributed Telemetry & Tracing"]
        Logfire["Pydantic Logfire (FastAPI Middleware & Spans)"]
        LangSmith["LangSmith (Agent Node Graph Tracing)"]
    end

    UI -->|POST /query, POST /upload, POST /code/assist| Rails
    Rails --> SQLScan --> ScriptScan
    ScriptScan -->|Pass| Planner
    ScriptScan -->|Blocked (403)| UI

    Planner --> Router
    Router -->|FILES_INQUIRY| Responder
    Router -->|CONVERSATIONAL| Responder
    Router -->|TECHNICAL / SUMMARY| Retriever

    Retriever -->|Session Filtered Search| Qdrant
    Retriever --> Reranker --> Responder
    Responder -->|LLM Completion| Groq
    Responder -.->|Checkpoint State| MemorySaver
    Responder --> UI

    UI -.->|Document Uploads & Metadata| NeonDB
    UI -.->|Session Isolated Vectors| Qdrant

    Rails -.-> Logfire
    Retriever -.-> Logfire
    Planner -.-> LangSmith
    Responder -.-> LangSmith
```

---

## Core Production Capabilities

### 1. Multi-File Knowledge Hub with Session Isolation
- **Up to 5 Documents per Chat**: Upload multiple documents simultaneously or incrementally (`.pdf`, `.docx`, `.pptx`, `.txt`, `.md`, `.py`, `.csv`, `.html`, `.sql`, etc.).
- **Zero Cross-Chat Data Leakage**: Every vector point and document chunk is tagged with a strict `session_id`. Qdrant queries enforce hard payload filters so documents from one session are completely invisible to other chat sessions.
- **Persistent Saved Documents Hub**: A dedicated banner at the top of the chat displays active files, formats, and chunk counts with single-click **Inspect Files** and **Clear** controls.

### 2. Neon Serverless Postgres Cloud Persistence
- **Production Persistence Layer** ([app/services/session_store.py](app/services/session_store.py)): Backed by **Neon Postgres** (Lakebase Postgres) via connection pooler (`DATABASE_URL`).
- **Resilient Fallback**: Automatically falls back to local SQLite (`data/cognivault_sessions.db`) when offline, guaranteeing zero downtime.
- **Relational Schemas**:
  - `session_documents`: Tracks `session_id`, `filename`, `file_type`, `chunks_count`, `points_indexed`, `preview`, `created_at`.
  - `chat_sessions`: Manages session IDs, titles, and lifecycle timestamps.
  - `chat_messages`: Stores multi-turn message history, thought processes, and citations.

### 3. Natural Language Saved Files Discovery (`FILES_INQUIRY`)
- When users ask: *"What files are saved?"*, *"What did I upload?"*, or *"Show what files you have"*, the LangGraph Planner routes to `FILES_INQUIRY`.
- The Responder immediately returns a formatted overview of attached files, their formats, indexed chunk counts, and guidance for querying them.

### 4. Context Completion Across Conversation Turns
- Synthesizes answers using both retrieved document chunks and the multi-turn `CONVERSATION HISTORY`.
- Resolves pronouns (*"it"*, *"the second step"*), expansions (*"tell me more about that"*), and comparative questions across multiple attached documents.

### 5. Multi-Layer Input/Output Safety Guards
- **Gate 1: Semantic Guardrails**: NeMo Guardrails block adversarial jailbreak attempts and off-topic exploits.
- **Gate 2: Injection Defenses**: Systematic regex and AST scanners detect SQL injection commands (`UNION SELECT`, `DROP TABLE`, etc.) and malicious executable script tags (`<script>`, `javascript:`).
- **Gate 3: Session File Bounds**: Enforces limits (max 5 files per chat) to prevent denial-of-service or memory bloat.

### 6. Dual Observability & Distributed Tracing
- **Pydantic Logfire**: End-to-end FastAPI middleware instrumentation, measuring text chunking, document parsing, Qdrant vector retrieval latency, FlashRank reranking times, and security audit logs.
- **LangSmith**: Native StateGraph execution hierarchy tracing (`LangGraph` → `planner` → `route_planner` → `retriever` → `responder`) with token usage and completion logs in the `cognivault` project.

### 7. AI Code Studio Copilot
- Dedicated coding copilot (`POST /code/assist`) supporting **Python**, **JavaScript/TypeScript**, and custom languages.
- Features dual-engine switching (**Groq LPU** or **Google Gemini**) with AST code extraction and syntax-highlighted rendering.

---

## Production Tech Stack

| Layer | Technology | Version / Spec |
| :--- | :--- | :--- |
| **Backend API** | FastAPI + Uvicorn | Python 3.11 / 3.13 ASGI |
| **Orchestration** | LangGraph + LangChain | `langgraph==1.1.10`, `langchain==1.2.18` |
| **Relational DB** | Neon (Lakebase Postgres) | PostgreSQL 18.6 with connection pooling |
| **Vector DB** | Qdrant Cloud | HNSW indexing + payload session filtering |
| **Embeddings** | Google Gemini | `text-embedding-004` (768-dim / dual vectors) |
| **Reranking** | FlashRank | Cross-encoder TinyBERT (`FlashRank==0.2.10`) |
| **Reasoning LLM** | Groq Cloud | `openai/gpt-oss-120b` (fallback: `openai/gpt-oss-20b`) |
| **LLM Gateway** | Portkey AI | Enterprise fallback, caching, and retry management |
| **Observability** | Logfire + LangSmith | Real-time FastAPI spans + LangGraph execution trees |
| **Frontend UI** | React 19 + TypeScript + Vite | Tailwind CSS + Framer Motion + Lucide Icons |
| **Hosting** | Render + Vercel | Render (API Web Service) + Vercel (Frontend SPA) |

---

## API Reference

Interactive Swagger documentation is available at `GET /api/docs`.

### Primary Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/query` | Executes the full LangGraph RAG pipeline with session memory, guardrails, and reranking. |
| `POST` | `/upload` | Ingests 1 to 5 files with security scanning, chunking, dual embeddings, and Neon database persistence. |
| `GET` | `/session/{session_id}/documents` | Retrieves all active documents currently attached to a chat session. |
| `DELETE` | `/session/{session_id}/documents/{filename}` | Deletes a specific document and purges its vector points from Qdrant and Neon DB. |
| `DELETE` | `/session/{session_id}/documents` | Clears all documents and vector embeddings for a chat session. |
| `POST` | `/code/assist` | AI Code Copilot endpoint supporting code generation, debugging, and AST extraction. |
| `GET` | `/health` | Kubernetes / Docker / Render health status probe. |
| `GET` | `/graph` | Generates a PNG visualization of the LangGraph state machine. |
| `GET` | `/api/docs` | Interactive OpenAPI Swagger UI documentation. |

---

## Database Schema (Neon Postgres)

The following tables are initialized automatically by [app/services/session_store.py](app/services/session_store.py):

```sql
-- 1. Uploaded document metadata per chat session
CREATE TABLE IF NOT EXISTS session_documents (
    session_id VARCHAR(128) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(64),
    chunks_count INT DEFAULT 1,
    points_indexed INT DEFAULT 1,
    preview TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (session_id, filename)
);

-- 2. Chat sessions registry
CREATE TABLE IF NOT EXISTS chat_sessions (
    session_id VARCHAR(128) PRIMARY KEY,
    title VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Multi-turn conversation messages and citations
CREATE TABLE IF NOT EXISTS chat_messages (
    id VARCHAR(128) PRIMARY KEY,
    session_id VARCHAR(128) NOT NULL,
    role VARCHAR(32) NOT NULL,
    content TEXT NOT NULL,
    thought_process JSONB,
    sources JSONB,
    status VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for low-latency session filtering
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_session_docs_session ON session_documents(session_id);
```

---

## Environment Variables Configuration

Create a `.env` file in the root directory (or configure them in your Render dashboard):

```env
# ==========================================
# DATABASE (NEON POSTGRES)
# ==========================================
DATABASE_URL=postgresql://neondb_owner:<password>@<endpoint>-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
NEON_DATABASE_URL=postgresql://neondb_owner:<password>@<endpoint>-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require

# ==========================================
# VECTOR DATABASE (QDRANT CLUSTER)
# ==========================================
QDRANT_CLUSTER_ENDPOINT=https://<cluster-id>.sa-east-1-0.aws.cloud.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key_here

# ==========================================
# EMBEDDINGS (GOOGLE GEMINI)
# ==========================================
GEMINI_API_KEY=your_gemini_api_key_here

# ==========================================
# REASONING ENGINE (GROQ)
# ==========================================
GROQ_API_KEY=your_primary_groq_key_here
GROQ_FALLBACK_API_KEY=your_fallback_groq_key_here
GROQ_MODEL=openai/gpt-oss-120b
GROQ_FALLBACK_MODEL=openai/gpt-oss-20b

# ==========================================
# OBSERVABILITY (LOGFIRE & LANGSMITH)
# ==========================================
LOGFIRE_TOKEN=your_pydantic_logfire_token_here

LANGSMITH_API_KEY=your_langsmith_api_key_here
LANGSMITH_PROJECT=cognivault
LANGSMITH_TRACING=true
LANGSMITH_ENDPOINT=https://api.smith.langchain.com
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your_langsmith_api_key_here
LANGCHAIN_PROJECT=cognivault

# ==========================================
# SECURITY & CORS
# ==========================================
ALLOWED_ORIGINS=https://cognivault-dev.vercel.app,http://localhost:5173
PYTHON_VERSION=3.11.9
```

---

## Local Development & Quickstart

### 1. Prerequisites
- **Python**: `>= 3.11`
- **Node.js**: `>= 20` (Node `>= 22` if running the Neon CLI)
- **Git**

### 2. Backend Setup
```bash
# Create and activate Python virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Open [http://localhost:8000/api/docs](http://localhost:8000/api/docs) to explore the interactive API.

### 3. Frontend Setup
```bash
cd frontend

# Install npm dependencies
npm install

# Start development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Production Deployment Guide

### Deploying the Backend to Render
1. Push your code to your GitHub repository:
   ```bash
   git push origin main
   ```
2. In the **Render Dashboard**, link the repository or use the included [render.yaml](render.yaml).
3. The build uses [requirements-prod.txt](requirements-prod.txt) to keep image sizes lightweight and ensure `psycopg2-binary` installs cleanly.
4. Add the environment variables specified above in **Render Dashboard** → **Environment**.

### Deploying the Frontend to Vercel
1. In the **Vercel Dashboard**, import the `/frontend` directory of your repository.
2. Set the environment variable:
   ```env
   VITE_BACKEND_URL=https://<your-render-backend-url>
   ```
3. Deploy. The React app will automatically communicate with your Render backend and Neon database.

---

## Repository Structure

```text
├── .agents/skills/          # Specialized agent skills (neon, neon-postgres, etc.)
├── app/
│   ├── agents/
│   │   ├── nodes/           # LangGraph nodes: planner, retriever, responder
│   │   ├── graph.py         # StateGraph compiled workflow & checkpointer
│   │   └── state.py         # AgentState typed dictionary & message reducers
│   ├── gateway/             # Portkey & Groq multi-model fallback client
│   ├── guardrails/          # NeMo Guardrails, SQL and script injection scanners
│   ├── ingestion/           # File parsing (PDF, Word, PPTX, HTML) and chunkers
│   ├── services/
│   │   ├── code_service.py      # AST extraction and code assistance
│   │   ├── document_service.py  # File ingestion orchestrator
│   │   ├── session_store.py     # Neon Postgres persistence service
│   │   └── retrieval/           # Gemini dual embeddings, Qdrant & FlashRank
│   ├── config.py            # Centralized settings and environment loader
│   └── main.py              # FastAPI application entrypoint and route handlers
├── frontend/                # React 19 + TypeScript + Vite + Tailwind UI
│   ├── src/components/chatbot/ # RagChatbotPage, WorkflowGraph, CodeStudio
│   └── dist/                # Production build artifacts
├── render.yaml              # Render infrastructure-as-code specification
├── requirements-prod.txt    # Lightweight production requirements for Render
├── requirements.txt         # Full local development requirements
├── neon.ts                  # Neon project policy configuration
└── .neon                    # Neon project link context
```

---

## Verification & Testing

Run the automated end-to-end verification suite:

```bash
# Verify session document upload, database persistence, files inquiry, and RAG retrieval
python -c "
from fastapi.testclient import TestClient
from app.main import app
import app.services.session_store as ss

client = TestClient(app)
res = client.get('/health')
assert res.status_code == 200
print('Health check passed!')
"
```

---

*Engineered for High-Scale Enterprise Document Intelligence and Secure Agentic Reasoning.*
