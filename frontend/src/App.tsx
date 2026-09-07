import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Loader from './Loader';
import {
  Plus,
  MessageSquare,
  Code2,
  FolderTree,
  FileText,
  Sliders,
  PanelLeftClose,
  PanelLeft,
  Trash2,
  Play,
  Copy,
  Check,
  Send,
  ChevronRight,
  ExternalLink,
  Terminal,
  ArrowDownToLine,
  Database,
  Cpu,
  Layers,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';

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
  const [activeView, setActiveView] = useState<'chat' | 'projects' | 'artifacts' | 'code' | 'customize'>('chat');
  const [selectedArtifactIndex, setSelectedArtifactIndex] = useState(0);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const [copiedArtifact, setCopiedArtifact] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

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

  // Interactive Code Studio State
  const [studioTab, setStudioTab] = useState<'studio' | 'graph' | 'api'>('studio');
  const [codeLanguage, setCodeLanguage] = useState<'python' | 'javascript'>('python');
  const [codeContent, setCodeContent] = useState<string>(`# Python Sandbox (Powered by Pyodide WebAssembly)
import math

def calculate_primes(limit):
    primes = []
    for num in range(2, limit + 1):
        if all(num % p != 0 for p in primes if p * p <= num):
            primes.append(num)
    return primes

result = calculate_primes(50)
print(f"Computed {len(result)} primes up to 50:")
print(result)
`);
  const [terminalOutput, setTerminalOutput] = useState<string>('Ready. Click Run Code to execute in your browser runtime.');
  const [terminalStatus, setTerminalStatus] = useState<string>('Ready');
  const [isExecuting, setIsExecuting] = useState(false);
  const [copilotEngine, setCopilotEngine] = useState<'groq' | 'gemini'>('groq');
  const [copilotPrompt, setCopilotPrompt] = useState('');
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);
  const [copilotMessages, setCopilotMessages] = useState<Array<{ role: 'user' | 'assistant', text: string, code?: string }>>([
    {
      role: 'assistant',
      text: 'AI Coding Copilot initialized with Groq and Gemini engines. You can request algorithmic solutions, code refactoring, or bug fixes, and execute the extracted code directly.'
    }
  ]);

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
    setActiveView('chat');
  };

  const switchSession = (targetSession: ChatSession) => {
    setSessionId(targetSession.id);
    setMessages(targetSession.messages);
    setActiveView('chat');
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

  const copyToClipboard = (text: string, index?: number) => {
    navigator.clipboard.writeText(text);
    if (index !== undefined) {
      setCopiedMessageIndex(index);
      setTimeout(() => setCopiedMessageIndex(null), 2000);
    } else {
      setCopiedArtifact(true);
      setTimeout(() => setCopiedArtifact(false), 2000);
    }
  };

  const sendQuery = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;

    setActiveView('chat');
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
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleLanguageChange = (newLang: 'python' | 'javascript') => {
    setCodeLanguage(newLang);
    if (newLang === 'javascript') {
      setCodeContent(`// JavaScript Sandbox Runtime
function quickSort(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[arr.length - 1];
  const left = arr.filter((x, i) => x < pivot && i < arr.length - 1);
  const right = arr.filter((x, i) => x >= pivot && i < arr.length - 1);
  return [...quickSort(left), pivot, ...quickSort(right)];
}

const numbers = [64, 34, 25, 12, 22, 11, 90];
console.log("Original Array:", numbers);
console.log("Sorted Array:  ", quickSort(numbers));
`);
    } else {
      setCodeContent(`# Python Sandbox (Powered by Pyodide WebAssembly)
import math

def calculate_primes(limit):
    primes = []
    for num in range(2, limit + 1):
        if all(num % p != 0 for p in primes if p * p <= num):
            primes.append(num)
    return primes

result = calculate_primes(50)
print(f"Computed {len(result)} primes up to 50:")
print(result)
`);
    }
  };

  const runCode = async () => {
    setIsExecuting(true);
    setTerminalStatus('Running...');
    const startTime = performance.now();

    try {
      if (codeLanguage === 'javascript') {
        const logs: string[] = [];
        const customConsole = {
          log: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
          error: (...args: any[]) => logs.push('[ERROR] ' + args.join(' ')),
          warn: (...args: any[]) => logs.push('[WARN] ' + args.join(' ')),
          info: (...args: any[]) => logs.push('[INFO] ' + args.join(' ')),
        };
        const runFn = new Function('console', codeContent);
        const ret = runFn(customConsole);
        if (ret !== undefined) {
          logs.push(`=> ${typeof ret === 'object' ? JSON.stringify(ret, null, 2) : ret}`);
        }
        const duration = ((performance.now() - startTime) / 1000).toFixed(3);
        setTerminalOutput(logs.length ? logs.join('\n') : '(Code executed successfully with no print output)');
        setTerminalStatus(`Success (${duration}s)`);
      } else {
        // Python execution in-browser via Pyodide WebAssembly
        setTerminalOutput('Initializing Pyodide WebAssembly runtime...');

        if (!(window as any).loadPyodide) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Pyodide WebAssembly engine.'));
            document.head.appendChild(script);
          });
        }

        let pyodide = (window as any).__pyodideInstance;
        if (!pyodide) {
          pyodide = await (window as any).loadPyodide();
          (window as any).__pyodideInstance = pyodide;
        }

        let pyStdout = '';
        pyodide.setStdout({ batched: (str: string) => { pyStdout += str + '\n'; } });
        pyodide.setStderr({ batched: (str: string) => { pyStdout += '[stderr] ' + str + '\n'; } });

        await pyodide.runPythonAsync(codeContent);
        const duration = ((performance.now() - startTime) / 1000).toFixed(3);
        setTerminalOutput(pyStdout.trim() || '(Python executed with no print output)');
        setTerminalStatus(`Success (${duration}s)`);
      }
    } catch (err: any) {
      const duration = ((performance.now() - startTime) / 1000).toFixed(3);
      setTerminalOutput(`[Execution Error]:\n${err.message || err}`);
      setTerminalStatus(`Error (${duration}s)`);
    } finally {
      setIsExecuting(false);
    }
  };

  const askCopilot = async (promptText: string) => {
    if (!promptText.trim() || isCopilotLoading) return;

    const userEntry = { role: 'user' as const, text: promptText };
    setCopilotMessages(prev => [...prev, userEntry]);
    setCopilotPrompt('');
    setIsCopilotLoading(true);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const res = await fetch(`${backendUrl}/code/assist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          code: codeContent,
          language: codeLanguage,
          engine: copilotEngine
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      setCopilotMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: data.answer,
          code: data.code || undefined
        }
      ]);
    } catch (err: any) {
      setCopilotMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `Error connecting to Coding Copilot: ${err.message || err}`
        }
      ]);
    } finally {
      setIsCopilotLoading(false);
    }
  };

  // Static enterprise architecture specifications
  const artifactsList = [
    {
      title: "Kubernetes Microservices Architecture",
      type: "Architecture Specification",
      content: `+-----------------------------------------------------------+
|                     Kubernetes Control Plane              |
|  API Server | Scheduler | Controller Manager | etcd       |
+---------------------------+-------------------------------+
                            |
+---------------------------v-------------------------------+
|                     Worker Nodes (Cluster)                |
|  kubelet | kube-proxy | CNI (Calico)                      |
|  RAG Service Set | Qdrant Vector Store | Ingress Gateway  |
+-----------------------------------------------------------+`
    },
    {
      title: "FastAPI Query Endpoint Schema",
      type: "API Specification",
      content: `class QueryRequest(BaseModel):
    q: str = Field(..., description="Query for knowledge base")
    thread_id: Optional[str] = Field("default_user", description="Memory session ID")
    persona: Optional[str] = Field("Enterprise Architect", description="Persona profile")
    system_prompt: Optional[str] = Field(None, description="Custom instructions")
    temperature: Optional[float] = Field(0.1, description="LLM sampling temperature")
    top_k: Optional[int] = Field(5, description="Number of reranked chunks")

class QueryResponse(BaseModel):
    question: str
    answer: Optional[str]
    thought_process: List[str]
    status: Optional[str]
    sources: List[str]`
    },
    {
      title: "Dual Named Vectors Collection Configuration",
      type: "Qdrant Vector Configuration",
      content: `qdrant_client.create_collection(
    collection_name="enterprise_rag",
    vectors_config={
        "gemini": VectorParams(size=3072, distance=Distance.COSINE),
        "local": VectorParams(size=768, distance=Distance.COSINE)
    }
)`
    }
  ];

  const getViewTitle = () => {
    switch (activeView) {
      case 'chat': return 'Knowledge Assistant';
      case 'projects': return 'Enterprise Projects';
      case 'artifacts': return 'Architecture Artifacts';
      case 'code': return 'AI Code Studio';
      case 'customize': return 'Agent Configuration';
      default: return 'Enterprise Assistant';
    }
  };

  return (
    <div className="app-layout">
      {/* ── Togglable Sidebar ── */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <Cpu size={16} />
            <span>Enterprise RAG</span>
          </div>
          <button className="btn-toggle-sidebar" onClick={toggleSidebar} title="Collapse Sidebar">
            <PanelLeftClose size={16} />
          </button>
        </div>

        <button className="btn-new-chat" onClick={handleNewChat}>
          <Plus size={15} />
          <span>New chat</span>
        </button>

        {/* Navigation Section */}
        <div className="nav-section">
          <div 
            className={`nav-item ${activeView === 'chat' ? 'active' : ''}`} 
            onClick={() => setActiveView('chat')}
          >
            <MessageSquare size={15} />
            <span>Chat</span>
          </div>
          <div 
            className={`nav-item ${activeView === 'code' ? 'active' : ''}`} 
            onClick={() => setActiveView('code')}
          >
            <Code2 size={15} />
            <span>Code Studio</span>
          </div>
          <div 
            className={`nav-item ${activeView === 'projects' ? 'active' : ''}`} 
            onClick={() => setActiveView('projects')}
          >
            <FolderTree size={15} />
            <span>Projects</span>
          </div>
          <div 
            className={`nav-item ${activeView === 'artifacts' ? 'active' : ''}`} 
            onClick={() => setActiveView('artifacts')}
          >
            <FileText size={15} />
            <span>Artifacts</span>
          </div>
          <div 
            className={`nav-item ${activeView === 'customize' ? 'active' : ''}`} 
            onClick={() => setActiveView('customize')}
          >
            <Sliders size={15} />
            <span>Customize</span>
          </div>
        </div>

        <div className="nav-section-title">Saved Conversations</div>
        <div className="history-list">
          <div className={`chat-history-row ${messages.length > 0 && !sessions.some(s => s.id === sessionId) ? 'active' : ''}`}>
            <button className="chat-title-btn" onClick={() => setActiveView('chat')}>
              <MessageSquare size={13} />
              <span>{messages.length > 0 ? "Current Conversation" : "Active Session"}</span>
            </button>
          </div>

          {sessions.map((sess) => (
            <div key={sess.id} className={`chat-history-row ${sess.id === sessionId && activeView === 'chat' ? 'active' : ''}`}>
              <button className="chat-title-btn" onClick={() => switchSession(sess)}>
                <MessageSquare size={13} />
                <span>{sess.title}</span>
              </button>
              <button 
                type="button"
                className="btn-delete-session" 
                onClick={(e) => deleteSession(e, sess.id)}
                title="Delete session"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <div>Persona: <code>{settings.persona}</code></div>
          <div>Session: <code>{sessionId}</code></div>
          <div>Engine: <code>Qdrant • Groq</code></div>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="main-content">
        <header className="top-navbar">
          <div className="navbar-left">
            {!isSidebarOpen && (
              <button className="btn-toggle-sidebar" onClick={toggleSidebar} title="Open Sidebar">
                <PanelLeft size={16} />
              </button>
            )}
            <div className="nav-breadcrumb">
              <span>Workspace</span>
              <span>/</span>
              <span className="active-label">{getViewTitle()}</span>
            </div>
          </div>
        </header>

        {/* ── VIEW 1: CHAT ── */}
        {activeView === 'chat' && (
          <>
            <div className="chat-container">
              {messages.length === 0 ? (
                <div className="hero-container">
                  <h1 className="hero-title">Enterprise Knowledge Workspace</h1>
                  <p className="hero-subtitle">
                    Agentic Retrieval-Augmented Generation • LangGraph Pipeline • Dual Embeddings
                  </p>

                  <div className="suggestions-grid">
                    <button
                      className="suggestion-card"
                      onClick={() => sendQuery("Explain the technical architecture and pipeline of this Enterprise RAG system.")}
                    >
                      <Layers size={16} />
                      <span>Technical Architecture & Pipeline</span>
                    </button>
                    <button
                      className="suggestion-card"
                      onClick={() => sendQuery("What input and output guardrails are configured via NeMo Guardrails?")}
                    >
                      <ShieldCheck size={16} />
                      <span>NeMo Guardrails & Safety Checks</span>
                    </button>
                    <button
                      className="suggestion-card"
                      onClick={() => sendQuery("How does vector search with Qdrant and FlashRank reranking work in this project?")}
                    >
                      <Database size={16} />
                      <span>Qdrant Vector Search & Reranking</span>
                    </button>
                    <button
                      className="suggestion-card"
                      onClick={() => sendQuery("Summarize the RAGAS evaluation pipeline and available evaluation metrics.")}
                    >
                      <FileText size={16} />
                      <span>Evaluation Metrics & Suite</span>
                    </button>
                  </div>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div key={index} className={`message-bubble ${msg.role}`}>
                    <div className="message-header">
                      <span className="message-role">{msg.role === 'user' ? 'You' : 'Assistant'}</span>
                      {msg.role === 'assistant' && (
                        <button 
                          type="button"
                          className="btn-copy" 
                          onClick={() => copyToClipboard(msg.content, index)}
                          title="Copy response"
                        >
                          {copiedMessageIndex === index ? (
                            <>
                              <Check size={12} />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    
                    {msg.thoughtProcess && msg.thoughtProcess.length > 0 && (
                      <details className="thought-accordion">
                        <summary className="thought-summary">
                          <ChevronRight size={14} />
                          <span>Reasoning Steps ({msg.thoughtProcess.length})</span>
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
                          <ChevronRight size={14} />
                          <span>Retrieved Context Sources ({msg.sources.length} chunks)</span>
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

              {isLoading && (
                <div style={{ marginTop: 16 }}>
                  <Loader />
                </div>
              )}
            </div>

            {/* Chat Input Bar */}
            <form className="input-container" onSubmit={handleSubmit}>
              <div className="input-wrapper">
                <input
                  type="text"
                  className="input-box"
                  placeholder="Ask a question about your enterprise documentation..."
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className="input-btn-send"
                  disabled={isLoading || !inputPrompt.trim()}
                  title="Send query"
                >
                  <Send size={15} />
                </button>
              </div>
            </form>
          </>
        )}

        {/* ── VIEW 2: CODE STUDIO ── */}
        {activeView === 'code' && (
          <div className="workspace-view">
            <div className="view-header">
              <div className="view-title-group">
                <h2>AI Code Studio & Runner</h2>
                <p>Interactive code generation, live testing, and runtime sandbox execution.</p>
              </div>
            </div>

            {/* Studio Navigation Tabs */}
            <div className="studio-tabs">
              <button 
                className={`studio-tab-btn ${studioTab === 'studio' ? 'active' : ''}`}
                onClick={() => setStudioTab('studio')}
              >
                <Terminal size={14} />
                <span>Interactive Studio</span>
              </button>
              <button 
                className={`studio-tab-btn ${studioTab === 'graph' ? 'active' : ''}`}
                onClick={() => setStudioTab('graph')}
              >
                <Layers size={14} />
                <span>State Machine Graph</span>
              </button>
              <button 
                className={`studio-tab-btn ${studioTab === 'api' ? 'active' : ''}`}
                onClick={() => setStudioTab('api')}
              >
                <ExternalLink size={14} />
                <span>API Reference</span>
              </button>
            </div>

            {/* Tab 1: Code Studio & Runner */}
            {studioTab === 'studio' && (
              <div className="code-studio-layout">
                {/* Left: AI Coding Copilot */}
                <div className="code-copilot-pane">
                  <div className="copilot-header">
                    <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Coding Copilot
                    </span>
                    <select 
                      className="copilot-model-select"
                      value={copilotEngine}
                      onChange={(e) => setCopilotEngine(e.target.value as 'groq' | 'gemini')}
                    >
                      <option value="groq">Groq (Fast)</option>
                      <option value="gemini">Gemini 2.5 (Flash)</option>
                    </select>
                  </div>

                  <div className="copilot-chat-history">
                    {copilotMessages.map((msg, idx) => (
                      <div key={idx} className={`copilot-msg ${msg.role}`}>
                        <div style={{ fontWeight: 600, fontSize: '0.74rem', marginBottom: 4, color: msg.role === 'user' ? '#93c5fd' : '#34d399' }}>
                          {msg.role === 'user' ? 'You' : `Copilot (${copilotEngine.toUpperCase()})`}
                        </div>
                        <div className="markdown-body" style={{ fontSize: '0.82rem' }}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.text}
                          </ReactMarkdown>
                        </div>
                        {msg.code && (
                          <button 
                            type="button"
                            className="btn-send-to-editor"
                            onClick={() => setCodeContent(msg.code || '')}
                          >
                            <ArrowDownToLine size={12} />
                            <span>Insert Code into Editor</span>
                          </button>
                        )}
                      </div>
                    ))}
                    {isCopilotLoading && (
                      <div className="copilot-msg assistant" style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Copilot is generating implementation...
                      </div>
                    )}
                  </div>

                  <form 
                    className="copilot-input-row"
                    onSubmit={(e) => {
                      e.preventDefault();
                      askCopilot(copilotPrompt);
                    }}
                  >
                    <input 
                      type="text" 
                      className="copilot-input"
                      placeholder="Ask to write, debug, or optimize code..."
                      value={copilotPrompt}
                      onChange={(e) => setCopilotPrompt(e.target.value)}
                      disabled={isCopilotLoading}
                    />
                    <button 
                      type="submit" 
                      className="copilot-btn-submit"
                      disabled={isCopilotLoading || !copilotPrompt.trim()}
                    >
                      <Send size={13} />
                    </button>
                  </form>
                </div>

                {/* Right: Code Editor & In-Browser Runner */}
                <div className="code-runner-pane">
                  <div className="runner-toolbar">
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <select 
                        className="copilot-model-select"
                        value={codeLanguage}
                        onChange={(e) => handleLanguageChange(e.target.value as 'python' | 'javascript')}
                      >
                        <option value="python">Python (Pyodide WASM)</option>
                        <option value="javascript">JavaScript (V8 Engine)</option>
                      </select>

                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        Client-side sandboxed execution
                      </span>
                    </div>

                    <button 
                      type="button"
                      className="btn-run-code"
                      onClick={runCode}
                      disabled={isExecuting}
                    >
                      <Play size={13} />
                      <span>{isExecuting ? 'Running...' : 'Run Code'}</span>
                    </button>
                  </div>

                  <textarea 
                    className="code-editor-box"
                    value={codeContent}
                    onChange={(e) => setCodeContent(e.target.value)}
                    spellCheck={false}
                    placeholder="// Type code here..."
                  />

                  <div className="terminal-box">
                    <div className="terminal-header">
                      <span>Console Output</span>
                      <span>Status: <strong style={{ color: terminalStatus.includes('Error') ? '#f87171' : '#34d399' }}>{terminalStatus}</strong></span>
                    </div>
                    <div className={`terminal-screen ${terminalStatus.includes('Error') ? 'error' : ''}`}>
                      {terminalOutput}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: State Machine Graph */}
            {studioTab === 'graph' && (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                  LangGraph workflow state diagram generated dynamically from backend topology:
                </p>
                <div style={{ display: 'inline-block', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', backgroundColor: 'var(--bg-sidebar)' }}>
                  <img 
                    src="http://localhost:8000/graph" 
                    alt="LangGraph Architecture Flow" 
                    style={{ maxWidth: '100%', maxHeight: 420, display: 'block' }} 
                  />
                </div>
              </div>
            )}

            {/* Tab 3: API Reference */}
            {studioTab === 'api' && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <h3 style={{ color: 'var(--text-primary)', marginBottom: 10, fontSize: '1.1rem' }}>
                  FastAPI OpenAPI Documentation
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginBottom: 20 }}>
                  Interactive Swagger UI for querying endpoints, inspecting schemas, and generating cURL commands.
                </p>
                <a 
                  href="http://localhost:8000/api/docs" 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn-primary"
                  style={{ textDecoration: 'none' }}
                >
                  <ExternalLink size={14} />
                  <span>Open /api/docs in New Tab</span>
                </a>
              </div>
            )}
          </div>
        )}

        {/* ── VIEW 3: PROJECTS ── */}
        {activeView === 'projects' && (
          <div className="workspace-view">
            <div className="view-header">
              <div className="view-title-group">
                <h2>Enterprise Knowledge Projects</h2>
                <p>Vector collections, document indexing status, and cluster health.</p>
              </div>
            </div>

            <div className="workspace-grid-2">
              <div className="workspace-card">
                <div className="workspace-card-title">Active Knowledge Base</div>
                <div className="workspace-card-text">
                  <strong>Enterprise Systems & Networking</strong><br />
                  Documentation covering Kubernetes v1.8, Intel DPDK, SR-IOV high performance networking, and memory architectures.
                </div>
                <div style={{ marginTop: 12 }}>
                  <span className="badge-tag">Qdrant Cloud</span>
                  <span className="badge-tag">Dual Vectors</span>
                  <span className="badge-tag">FlashRank Reranking</span>
                </div>
              </div>

              <div className="workspace-card">
                <div className="workspace-card-title">Vector Engine Details</div>
                <div className="workspace-card-text">
                  <strong>Cluster:</strong> SA-East-1 AWS<br />
                  <strong>Collection:</strong> <code>enterprise_rag</code><br />
                  <strong>Vectors:</strong> <code>gemini</code> (3072-d), <code>local</code> (768-d)<br />
                  <strong>Status:</strong> Active & Synchronized
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: '0.92rem', color: 'var(--text-primary)', marginBottom: 12 }}>
              Indexed Document Library
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <span className="badge-tag"><FileText size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Kubernetes Overview v1.8</span>
              <span className="badge-tag"><FileText size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Intel DPDK Dataplane Guide</span>
              <span className="badge-tag"><FileText size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />SR-IOV High Perf Networking</span>
              <span className="badge-tag"><FileText size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />5-Level Paging Intel Spec</span>
              <span className="badge-tag"><FileText size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Parallel Page Cache Systems</span>
              <span className="badge-tag"><FileText size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Memory Consistency Models</span>
              <span className="badge-tag"><FileText size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Lock-Free Hash Tables</span>
            </div>
          </div>
        )}

        {/* ── VIEW 4: ARTIFACTS ── */}
        {activeView === 'artifacts' && (
          <div className="workspace-view">
            <div className="view-header">
              <div className="view-title-group">
                <h2>Architecture Artifacts & Specifications</h2>
                <p>System diagrams, endpoint schemas, and infrastructure configurations.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 20, flex: 1 }}>
              <div style={{ width: 260, borderRight: '1px solid var(--border)', paddingRight: 16 }}>
                {artifactsList.map((art, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedArtifactIndex(idx)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 6,
                      marginBottom: 6,
                      cursor: 'pointer',
                      backgroundColor: selectedArtifactIndex === idx ? 'var(--bg-surface)' : 'transparent',
                      border: selectedArtifactIndex === idx ? '1px solid var(--border)' : '1px solid transparent',
                      color: selectedArtifactIndex === idx ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontSize: '0.84rem'
                    }}
                  >
                    <strong style={{ display: 'block', fontSize: '0.82rem' }}>{art.title}</strong>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{art.type}</div>
                  </div>
                ))}
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                    {artifactsList[selectedArtifactIndex].title}
                  </h3>
                  <button 
                    type="button"
                    className="btn-copy" 
                    onClick={() => copyToClipboard(artifactsList[selectedArtifactIndex].content)}
                  >
                    {copiedArtifact ? (
                      <>
                        <Check size={12} />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy Spec</span>
                      </>
                    )}
                  </button>
                </div>
                <pre style={{
                  backgroundColor: '#0d0d10',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: 14,
                  fontSize: '0.82rem',
                  lineHeight: 1.45,
                  overflowY: 'auto',
                  flex: 1,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
                }}>
                  <code>{artifactsList[selectedArtifactIndex].content}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* ── VIEW 5: CUSTOMIZE ── */}
        {activeView === 'customize' && (
          <div className="workspace-view">
            <div className="view-header">
              <div className="view-title-group">
                <h2>Agent Configuration</h2>
                <p>Customize system persona instructions, LLM sampling temperature, and reranking thresholds.</p>
              </div>
              {savedNotice && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#34d399', fontSize: '0.82rem' }}>
                  <CheckCircle2 size={15} />
                  <span>Configuration saved</span>
                </div>
              )}
            </div>

            <div style={{ maxWidth: 640 }}>
              <div className="form-group">
                <label className="form-label">Persona Mode</label>
                <select 
                  className="form-select"
                  value={settings.persona}
                  onChange={(e) => setSettings({ ...settings, persona: e.target.value })}
                >
                  <option value="Enterprise Architect">Enterprise Architect (Comprehensive & In-Depth)</option>
                  <option value="DevOps Engineer">DevOps Engineer (Practical & Infrastructure-Oriented)</option>
                  <option value="Security Auditor">Security Auditor (Policy & Compliance Focused)</option>
                  <option value="Concise Explainer">Concise Explainer (Short & Direct)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">System Instruction Addendum</label>
                <textarea 
                  className="form-textarea"
                  rows={4}
                  value={settings.systemPrompt}
                  onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
                />
              </div>

              <div className="workspace-grid-2">
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

              <div style={{ marginTop: 16 }}>
                <button 
                  type="button"
                  className="btn-primary" 
                  onClick={() => saveCustomSettings(settings)}
                >
                  <Check size={14} />
                  <span>Save Configuration</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;


