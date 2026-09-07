# 🚀 Important Commands Reference (`imp_cammands.md`)

This guide contains all essential commands for running, developing, evaluating, and deploying the Enterprise Agentic RAG system.

---

## 1. 🐍 Environment Setup & Activation

### Virtual Environment (Python)
```bash
# Activate existing virtual environment
source .venv/bin/activate

# Or recreate virtual environment if needed
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Frontend Environment (Node.js)
```bash
cd frontend
npm install
```

### Environment Configuration
```bash
# Copy example environment if .env doesn't exist
cp .env.example .env

# Verify critical environment variables
cat .env | grep -E "GROQ_API_KEY|QDRANT|PORTKEY|LOGFIRE"
```

---

## 2. ⚡ Backend FastAPI Service

### Start Backend API Server
```bash
# Development mode with hot reload (Port 8000)
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Health Check & API Testing
```bash
# Health check
curl -X GET http://localhost:8000/

# Test RAG query endpoint with CORS headers
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"q": "What is SRIOV networking?", "thread_id": "session_1"}'

# Interactive OpenAPI / Swagger documentation (test with cURL inside docs)
# Open in browser: http://localhost:8000/api/docs
```

---

## 3. 🎨 Frontend Applications

### Modern React + Vite Web App (Primary UI)
```bash
# Start Vite development server (Port 5173)
cd frontend
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```
*Access in browser at:* `http://localhost:5173`

### Streamlit Chat Interface (Claude Theme)
```bash
source .venv/bin/activate
streamlit run ui/app.py --server.port 8501
```
*Access in browser at:* `http://localhost:8501`

### Streamlit Cloud Interface
```bash
source .venv/bin/activate
streamlit run ui/st_cloud_ui.py --server.port 8502
```

---

## 4. 📚 Data Ingestion & Vector Store (Qdrant)

### Universal Ingestion Pipeline
```bash
source .venv/bin/activate

# Ingest all documents from data folder (with fresh collection wipe)
python -m app.ingestion.processor --wipe

# Ingest specific directory without wiping
python -m app.ingestion.processor --target processed_data/noisy

# Ingest a single file
python -m app.ingestion.processor --target "data/sample.pdf" --type pdf
```

---

## 5. 📊 Evaluation Pipeline (RAGAS & LangSmith)

### Run RAGAS Golden Dataset Evaluation
```bash
source .venv/bin/activate

# Run evaluation suite
python evals/app.py
```

---

## 6. 🐳 Docker & Container Deployment

### Build & Run Container Locally
```bash
# Build Docker image
docker build -t enterprise-rag:latest .

# Run container with environment file
docker run -d -p 8000:8000 --env-file .env --name enterprise-rag-service enterprise-rag:latest

# View container logs
docker logs -f enterprise-rag-service

# Stop container
docker stop enterprise-rag-service
```

---

## 7. 🐙 Git & Remote Push Workflow

### Inspect Repository & Commit History
```bash
# Check status and staged files
git status

# Inspect recent commits with author and date
git log -n 5 --format="%h | %cd | %s" --date=short
```

### Push to GitHub Remote
```bash
# Standard push (interactive credentials prompt)
git push origin main

# Push with Personal Access Token (PAT)
git push https://<GITHUB_TOKEN>@github.com/honoursbhaduria/RAG.git main

# Or configure credential helper to save token
git config --global credential.helper store
git push origin main
```
