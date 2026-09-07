import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Loader from './Loader';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  thoughtProcess?: string[];
  sources?: string[];
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
}

export function App() {
  const [sessionId, setSessionId] = useState(() => {
    return localStorage.getItem('claude_rag_current_session') || Math.random().toString(36).substring(2, 10);
  });
  
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('claude_rag_sessions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeModal, setActiveModal] = useState<'projects' | 'artifacts' | 'code' | 'customize' | null>(null);
  const [selectedArtifactIndex, setSelectedArtifactIndex] = useState(0);

  // User Customization Settings
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('claude_rag_custom_settings');
      return saved ? JSON.parse(saved) : {
        persona: 'Enterprise Architect',
        temperature: 0.1,
        topK: 5,
        systemPrompt: 'You are an Enterprise AI Architect specializing in distributed systems, Kubernetes, and networking.'
      };
    } catch {
      return {
        persona: 'Enterprise Architect',
        temperature: 0.1,
        topK: 5,
        systemPrompt: 'You are an Enterprise AI Architect specializing in distributed systems, Kubernetes, and networking.'
      };
    }
  });

  // Sync current session messages on mount or session switch
  useEffect(() => {
    const existing = sessions.find((s) => s.id === sessionId);
    if (existing) {
      setMessages(existing.messages);
    }
    localStorage.setItem('claude_rag_current_session', sessionId);
  }, [sessionId]);

  // Persist sessions to localStorage
  const saveSessionsToStorage = (updatedSessions: ChatSession[]) => {
    setSessions(updatedSessions);
    try {
      localStorage.setItem('claude_rag_sessions', JSON.stringify(updatedSessions));
    } catch (e) {
      console.error('Failed to save sessions to localStorage', e);
    }
  };

  const handleNewChat = () => {
    const newId = Math.random().toString(36).substring(2, 10);
    setSessionId(newId);
    setMessages([]);
    setInputPrompt('');
  };

  const switchSession = (targetSession: ChatSession) => {
    setSessionId(targetSession.id);
    setMessages(targetSession.messages);
  };

  const deleteSession = (e: React.MouseEvent, idToDelete: string) => {
    e.stopPropagation();
    const updated = sessions.filter((s) => s.id !== idToDelete);
    saveSessionsToStorage(updated);
    if (sessionId === idToDelete) {
      handleNewChat();
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const sendQuery = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: queryText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          q: queryText, 
          thread_id: sessionId,
          persona: settings.persona,
          system_prompt: settings.systemPrompt,
          temperature: settings.temperature,
          top_k: settings.topK
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.answer || 'No response received from agent.',
        thoughtProcess: data.thought_process || [],
        sources: data.sources || []
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);

      // Update or create session entry
      const existingIdx = sessions.findIndex((s) => s.id === sessionId);
      const title = queryText.length > 34 ? queryText.slice(0, 34) + '...' : queryText;
      
      let updatedSessions: ChatSession[];
      if (existingIdx >= 0) {
        updatedSessions = [...sessions];
        updatedSessions[existingIdx] = {
          ...updatedSessions[existingIdx],
          messages: finalMessages,
          timestamp: Date.now()
        };
      } else {
        updatedSessions = [
          { id: sessionId, title, messages: finalMessages, timestamp: Date.now() },
          ...sessions
        ];
      }
      saveSessionsToStorage(updatedSessions);

    } catch (err: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Unable to connect to backend server (${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}). Error: ${err.message || err}`
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendQuery(inputPrompt);
  };

  const saveCustomSettings = (newSettings: typeof settings) => {
    setSettings(newSettings);
    localStorage.setItem('claude_rag_custom_settings', JSON.stringify(newSettings));
    setActiveModal(null);
  };

  // Sample or extracted artifacts
  const artifactsList = [
    {
      title: "Kubernetes Microservices Architecture",
      type: "Architecture Spec",
      content: `+-----------------------------------------------------------+
|                     Kubernetes Control Plane              |
|  API Server | Scheduler | Controller Manager | etcd       |
+---------------------------+-------------------------------+
                            |
+---------------------------v-------------------------------+
|                     Worker Nodes (x N)                    |
|  kubelet | kube-proxy | CNI (Calico)                      |
|  RAG Service Set | Qdrant Vector Store | Ingress Gateway  |
+-----------------------------------------------------------+`
    },
    {
      title: "FastAPI /query Endpoint Schema",
      type: "Code / API Spec",
      content: `class QueryRequest(BaseModel):
    q: str = Field(..., description="Query for knowledge base")
    thread_id: Optional[str] = Field("default_user", description="Memory session ID")

class QueryResponse(BaseModel):
    question: str
    answer: Optional[str]
    thought_process: List[str]
    status: Optional[str]
    sources: List[str]`
    },
    {
      title: "Dual Named Vectors Collection Config",
      type: "Qdrant Schema",
      content: `qdrant_client.create_collection(
    collection_name="enterprise_rag",
    vectors_config={
        "gemini": VectorParams(size=3072, distance=Distance.COSINE),
        "local": VectorParams(size=768, distance=Distance.COSINE)
    }
)`
    }
  ];

  return (
    <>
      {/* Pure 3D Topology Background */}
      <iframe src="/topology-bg.html" className="topology-bg-iframe" title="Topology Field Background" />

      <div className="app-layout">
        {/* Togglable Sidebar */}
        <aside className={`sidebar ${isSidebarOpen ? 'open' : 'collapsed'}`}>
          <div className="sidebar-header">
            <h2 className="sidebar-title">Claude</h2>
            <button className="btn-toggle-sidebar" onClick={toggleSidebar} title="Collapse Sidebar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="3" x2="9" y2="21"></line>
              </svg>
            </button>
          </div>

          <button className="btn-new-chat" onClick={handleNewChat}>
            + New chat
          </button>

          {/* Navigation Items (Projects, Artifacts, Code, Customize) */}
          <div className="nav-section">
            <div className="nav-item" onClick={() => setActiveModal('projects')}>
              📁 Projects
            </div>
            <div className="nav-item" onClick={() => setActiveModal('artifacts')}>
              📦 Artifacts
            </div>
            <div className="nav-item" onClick={() => setActiveModal('code')}>
              💻 Code & Graph
            </div>
            <div className="nav-item" onClick={() => setActiveModal('customize')}>
              ⚙️ Customize
            </div>
          </div>

          <div className="nav-section-title">Chats and tasks</div>
          <div className="history-list">
            <div className={`chat-history-row ${messages.length > 0 && !sessions.some(s => s.id === sessionId) ? 'active' : ''}`}>
              <button className="chat-title-btn" onClick={() => {}}>
                {messages.length > 0 ? "Current Conversation" : "New Session"}
              </button>
            </div>

            {sessions.map((sess) => (
              <div key={sess.id} className={`chat-history-row ${sess.id === sessionId ? 'active' : ''}`}>
                <button className="chat-title-btn" onClick={() => switchSession(sess)}>
                  {sess.title}
                </button>
                <button 
                  type="button"
                  className="btn-delete-session" 
                  onClick={(e) => deleteSession(e, sess.id)}
                  title="Delete chat"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="sidebar-footer">
            <div>Persona: <code>{settings.persona}</code></div>
            <div>Memory ID: <code>{sessionId}</code></div>
            <div>honours • Enterprise</div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="main-content">
          <header className="top-navbar">
            {!isSidebarOpen && (
              <button className="btn-toggle-sidebar" onClick={toggleSidebar} title="Open Sidebar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="9" y1="3" x2="9" y2="21"></line>
                </svg>
              </button>
            )}
            <div className="upgrade-pill">
              Enterprise RAG • <span>Qdrant Connected</span>
            </div>
          </header>

          <div className="chat-container">
            {messages.length === 0 ? (
              <div className="hero-container">
                <h1 className="hero-title">What shall we think through?</h1>
                <p className="hero-subtitle">
                  Enterprise Agentic RAG Assistant • LangGraph Reasoning • Qdrant Vector Engine
                </p>

                <div className="suggestions-grid">
                  <button
                    className="suggestion-card"
                    onClick={() => sendQuery("Explain the technical architecture and pipeline of this Enterprise RAG system.")}
                  >
                    Technical Architecture & Pipeline
                  </button>
                  <button
                    className="suggestion-card"
                    onClick={() => sendQuery("What input and output guardrails are configured via NeMo Guardrails?")}
                  >
                    NeMo Guardrails & Safety Checks
                  </button>
                  <button
                    className="suggestion-card"
                    onClick={() => sendQuery("How does vector search with Qdrant and FlashRank reranking work in this project?")}
                  >
                    Qdrant Vector Search & Reranking
                  </button>
                  <button
                    className="suggestion-card"
                    onClick={() => sendQuery("Summarize the RAGAS evaluation pipeline and available evaluation metrics.")}
                  >
                    Evaluation Metrics & Suite
                  </button>
                </div>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className={`message-bubble ${msg.role}`}>
                  <div className="message-header">
                    <span className="message-role">{msg.role === 'user' ? 'You' : 'Claude'}</span>
                    {msg.role === 'assistant' && (
                      <button 
                        type="button"
                        className="btn-copy" 
                        onClick={() => navigator.clipboard.writeText(msg.content)}
                        title="Copy answer"
                      >
                        Copy
                      </button>
                    )}
                  </div>
                  
                  {msg.thoughtProcess && msg.thoughtProcess.length > 0 && (
                    <details className="thought-accordion">
                      <summary className="thought-summary">
                        <span>⚙️ Reasoning Steps ({msg.thoughtProcess.length})</span>
                      </summary>
                      <div className="thought-content">
                        <ul>
                          {msg.thoughtProcess.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    </details>
                  )}

                  <div className="message-text markdown-body">
                    {msg.role === 'user' ? (
                      <p>{msg.content}</p>
                    ) : (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    )}
                  </div>

                  {msg.sources && msg.sources.length > 0 && (
                    <details className="sources-accordion">
                      <summary className="sources-summary">
                        <span>📄 Retrieved Context Sources ({msg.sources.length} chunks)</span>
                      </summary>
                      <div className="sources-content">
                        {msg.sources.map((src, i) => (
                          <div key={i} className="source-item">
                            <span className="source-badge">Chunk {i + 1}</span>
                            <div className="source-text">{src.replace(/^CONTENT:\s*/, '')}</div>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              ))
            )}

            {/* Custom SVG Circuit Loader Component */}
            {isLoading && (
              <div style={{ marginTop: 20 }}>
                <Loader />
              </div>
            )}
          </div>

          {/* Input Bar */}
          <form className="input-container" onSubmit={handleSubmit}>
            <input
              type="text"
              className="input-box"
              placeholder="How can I help you today?"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              disabled={isLoading}
            />
          </form>
        </main>
      </div>

      {/* ── PROJECTS MODAL ─────────────────────────────────────── */}
      {activeModal === 'projects' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📁 Enterprise Knowledge Projects</h3>
              <button className="btn-close-modal" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-grid-2">
                <div className="modal-card">
                  <div className="modal-card-title">Active Knowledge Base</div>
                  <div className="modal-card-text">
                    <strong>Enterprise Systems & Networking</strong><br />
                    Indexed documentation covering Kubernetes v1.8, Intel DPDK, SR-IOV high performance networking, and memory architectures.
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <span className="badge-tag">Qdrant Cloud</span>
                    <span className="badge-tag">Dual Vectors</span>
                    <span className="badge-tag">FlashRank</span>
                  </div>
                </div>

                <div className="modal-card">
                  <div className="modal-card-title">Storage & Vector Engine</div>
                  <div className="modal-card-text">
                    <strong>Cluster:</strong> SA-East-1 AWS<br />
                    <strong>Collection:</strong> <code>enterprise_rag</code><br />
                    <strong>Vectors:</strong> <code>gemini</code> (3072-d), <code>local</code> (768-d)<br />
                    <strong>Status:</strong> Active & Synced
                  </div>
                </div>
              </div>

              <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: 10 }}>Indexed Document Library</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <span className="badge-tag">📄 Kubernetes Overview v1.8</span>
                <span className="badge-tag">📄 Intel DPDK Dataplane Guide</span>
                <span className="badge-tag">📄 SR-IOV High Perf Networking</span>
                <span className="badge-tag">📄 5-Level Paging Intel Spec</span>
                <span className="badge-tag">📄 Parallel Page Cache Systems</span>
                <span className="badge-tag">📄 Memory Consistency Models</span>
                <span className="badge-tag">📄 Lock-Free Hash Tables</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ARTIFACTS MODAL ────────────────────────────────────── */}
      {activeModal === 'artifacts' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📦 Enterprise Architecture Artifacts</h3>
              <button className="btn-close-modal" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', gap: 20 }}>
              <div style={{ width: 220, borderRight: '1px solid rgba(255,255,255,0.08)', paddingRight: 12 }}>
                {artifactsList.map((art, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedArtifactIndex(idx)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      marginBottom: 6,
                      cursor: 'pointer',
                      background: selectedArtifactIndex === idx ? 'rgba(218, 119, 86, 0.18)' : 'rgba(255,255,255,0.03)',
                      border: selectedArtifactIndex === idx ? '1px solid rgba(218, 119, 86, 0.4)' : '1px solid transparent',
                      color: selectedArtifactIndex === idx ? '#ffffff' : '#aaaaaa',
                      fontSize: '0.84rem'
                    }}
                  >
                    <strong>{art.title}</strong>
                    <div style={{ fontSize: '0.72rem', color: '#888888', marginTop: 3 }}>{art.type}</div>
                  </div>
                ))}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <h4 style={{ color: '#fff', fontSize: '0.95rem' }}>{artifactsList[selectedArtifactIndex].title}</h4>
                  <button 
                    className="btn-copy" 
                    onClick={() => navigator.clipboard.writeText(artifactsList[selectedArtifactIndex].content)}
                  >
                    Copy Artifact
                  </button>
                </div>
                <pre style={{
                  background: '#111',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  padding: 14,
                  fontSize: '0.82rem',
                  lineHeight: 1.45,
                  maxHeight: 340,
                  overflowY: 'auto'
                }}>
                  <code>{artifactsList[selectedArtifactIndex].content}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CODE & GRAPH MODAL ─────────────────────────────────── */}
      {activeModal === 'code' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">💻 Workflow Graph & Pipeline Code</h3>
              <button className="btn-close-modal" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.86rem', color: '#aaaaaa' }}>
                  Live LangGraph State Machine Graph rendered directly from backend:
                </span>
                <a 
                  href="http://localhost:8000/api/docs" 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ color: '#da7756', fontSize: '0.82rem', textDecoration: 'underline' }}
                >
                  Open Interactive Swagger Docs (/api/docs) ↗
                </a>
              </div>

              <div style={{
                textAlign: 'center',
                padding: 16,
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.08)',
                marginBottom: 16
              }}>
                <img 
                  src="http://localhost:8000/graph" 
                  alt="LangGraph Architecture Flow" 
                  style={{ maxWidth: '100%', maxHeight: 260, borderRadius: 6 }} 
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              <div className="modal-card">
                <div className="modal-card-title">LangGraph Agent Nodes</div>
                <div className="modal-card-text">
                  • <strong>Guardrails:</strong> NeMo Colang safety filter (greeting, off-topic, jailbreak detection)<br />
                  • <strong>Planner Node:</strong> Evaluates conversational vs technical intent<br />
                  • <strong>Retriever Node:</strong> Multi-vector search across Qdrant cluster + FlashRank reranker<br />
                  • <strong>Responder Node:</strong> Groq LLM synthesis with Portkey gateway fallback
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CUSTOMIZE MODAL ────────────────────────────────────── */}
      {activeModal === 'customize' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">⚙️ Customize Agent Persona & Parameters</h3>
              <button className="btn-close-modal" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Persona Mode</label>
                <select 
                  className="form-select"
                  value={settings.persona}
                  onChange={(e) => setSettings({ ...settings, persona: e.target.value })}
                >
                  <option value="Enterprise Architect">Enterprise Architect (Comprehensive & Deep)</option>
                  <option value="DevOps Engineer">DevOps Engineer (Practical & Code-Oriented)</option>
                  <option value="Security Auditor">Security Auditor (Policy & Compliance Focused)</option>
                  <option value="Concise Explainer">Concise Explainer (Short & Direct)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">System Instruction Addendum</label>
                <textarea 
                  className="form-textarea"
                  rows={3}
                  value={settings.systemPrompt}
                  onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
                />
              </div>

              <div className="modal-grid-2">
                <div className="form-group">
                  <label className="form-label">LLM Temperature: {settings.temperature}</label>
                  <input 
                    type="range" 
                    min="0.0" 
                    max="1.0" 
                    step="0.05"
                    value={settings.temperature}
                    className="form-range"
                    onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Qdrant Rerank Top-K: {settings.topK}</label>
                  <input 
                    type="range" 
                    min="3" 
                    max="15" 
                    step="1"
                    value={settings.topK}
                    className="form-range"
                    onChange={(e) => setSettings({ ...settings, topK: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div style={{ textAlign: 'right', marginTop: 10 }}>
                <button 
                  className="btn-primary" 
                  onClick={() => saveCustomSettings(settings)}
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;

