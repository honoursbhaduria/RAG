import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Loader from './Loader';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  thoughtProcess?: string[];
  sources?: string[];
}

export function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 10));
  const [threads] = useState<string[]>([
    "Technical Architecture & Pipeline",
    "Vector Search & Qdrant Pipeline",
    "NeMo Guardrails Configuration",
    "RAGAS Evaluation Suite"
  ]);

  const handleNewChat = () => {
    setMessages([]);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const sendQuery = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: queryText };
    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: queryText, thread_id: sessionId })
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

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Unable to connect to backend server (${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}). Error: ${err.message || err}`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendQuery(inputPrompt);
  };

  return (
    <>
      {/* Pure 3D Topology Background (Text Removed) */}
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

          <div className="nav-section">
            <div className="nav-item">Projects</div>
            <div className="nav-item">Artifacts</div>
            <div className="nav-item">Code</div>
            <div className="nav-item">Customize</div>
          </div>

          <div className="nav-section-title">Chats and tasks</div>
          <div className="history-list">
            <div className="chat-history-item active">
              {messages.length > 0 ? "Current Conversation" : "New Session"}
            </div>
            {threads.map((thread, idx) => (
              <div key={idx} className="chat-history-item" onClick={() => sendQuery(thread)}>
                {thread}
              </div>
            ))}
          </div>

          <div className="sidebar-footer">
            <div>Memory ID: <code>{sessionId}</code></div>
            <div>honours • Free</div>
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
              Free plan • <span>Upgrade</span>
            </div>
          </header>

          <div className="chat-container">
            {messages.length === 0 ? (
              <div className="hero-container">
                <h1 className="hero-title">What shall we think through?</h1>
                <p className="hero-subtitle">
                  Enterprise Agentic RAG Assistant • LangGraph Reasoning • React Frontend
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

            {/* Custom SVG Circuit Loader Component when waiting for Backend response */}
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
    </>
  );
}

export default App;
