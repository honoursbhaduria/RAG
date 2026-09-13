import React, { useState, useEffect, useRef } from 'react';
import { CodeBlock } from '@/components/ui/code-block';
import MarkdownRenderer from './MarkdownRenderer';
import AiWorkflowGraph from './AiWorkflowGraph';
import { API_BASE_URL } from '@/config';

interface RagChatbotPageProps {
  onBack: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  thought_process?: string[];
  sources?: string[];
  status?: string;
  isGuardrailBlocked?: boolean;
  codeSnippet?: string;
  codeLanguage?: string;
}

interface Thread {
  id: string;
  title: string;
  createdAt: string;
  messages: Message[];
  activeDocument?: {
    filename: string;
    chunksCount?: number;
    pointsIndexed?: number;
  };
}

const BACKEND_URL = API_BASE_URL;

const PERSONAS = [
  { id: 'Enterprise Architect', label: 'Enterprise Architect', desc: 'High-level systems, low-latency, and distributed architecture' },
  { id: 'Security Auditor', label: 'Security Auditor', desc: 'Zero-trust guardrails, threat modeling, and injection defense' },
  { id: 'Technical Researcher', label: 'Technical Researcher', desc: 'In-depth algorithms, math formulations, and citations' },
  { id: 'Code Specialist', label: 'Code Specialist', desc: 'Concise implementation code, edge cases, and benchmarks' },
];

const STARTER_PROMPTS = [
  {
    title: 'LangGraph Reasoning Graph',
    desc: 'How does LangGraph cyclic planning coordinate retrieval and response?',
    query: 'How does the LangGraph StateGraph agent loop manage routing, cycle detection, and memory persistence in this architecture?',
  },
  {
    title: 'Zero-Trust NeMo Guardrails',
    desc: 'Explain how NeMo Guardrails prevents prompt injections & jailbreaks.',
    query: 'Explain the 2-tier security model: sub-millisecond regex scanning and NVIDIA NeMo Guardrails Colang flows before search execution.',
  },
  {
    title: 'HNSW & FlashRank Rerank',
    desc: 'What is HNSW vector indexing and why is FlashRank reranking used?',
    query: 'Explain HNSW graph clustering in Qdrant and why two-stage FlashRank cross-encoder reranking is required for high precision.',
  },
  {
    title: 'Dual Embeddings Strategy',
    desc: 'Compare dense 3072-dim embeddings vs local Sentence-Transformers.',
    query: 'How does the system leverage Gemini 3072-dim dense embeddings alongside local 768-dim all-mpnet-base-v2 failover?',
  },
];

export const RagChatbotPage: React.FC<RagChatbotPageProps> = ({ onBack }) => {
  // Navigation & Mode
  const [activeTab, setActiveTab] = useState<'rag' | 'code'>('rag');
  const [showSettings, setShowSettings] = useState(false);
  const [showGraphModal, setShowGraphModal] = useState(false);

  // Sidebar Toggle & Responsive State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Settings State
  const [persona, setPersona] = useState('Enterprise Architect');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [temperature, setTemperature] = useState(0.1);
  const [topK, setTopK] = useState(5);

  // Code Studio Mode State
  const [codeEngine, setCodeEngine] = useState<'groq' | 'gemini'>('groq');
  const [codeLanguage, setCodeLanguage] = useState('python');
  const [codeContext, setCodeContext] = useState('');
  const [showCodeContextInput, setShowCodeContextInput] = useState(false);

  // Thread & Conversation Management
  const [threads, setThreads] = useState<Thread[]>(() => {
    const initialId = `session_${Date.now()}`;
    return [
      {
        id: initialId,
        title: 'Initial RAG Session',
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        messages: [],
      },
    ];
  });
  const [activeThreadId, setActiveThreadId] = useState<string>(threads[0]?.id || 'session_1');

  // Input & Upload State
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);

  // UI Expanded States
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];

  // Responsive Sidebar Initialization
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages, isLoading]);

  // Create New Thread
  const handleNewThread = () => {
    const newId = `session_${Date.now()}`;
    const newThread: Thread = {
      id: newId,
      title: `Session ${threads.length + 1}`,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      messages: [],
    };
    setThreads([newThread, ...threads]);
    setActiveThreadId(newId);
    setInputQuery('');
    setUploadFeedback(null);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  // Handle Document Upload via POST /upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setUploadFeedback('Scanning file with NeMo Guardrails & Chunking...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('session_id', activeThreadId);

    try {
      const res = await fetch(`${BACKEND_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload failed with status ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        setThreads((prev) =>
          prev.map((t) =>
            t.id === activeThreadId
              ? {
                  ...t,
                  activeDocument: {
                    filename: data.filename,
                    chunksCount: data.chunks_count,
                    pointsIndexed: data.points_indexed,
                  },
                }
              : t
          )
        );

        setUploadFeedback(
          `Document '${data.filename}' verified safe & indexed into Qdrant (${data.chunks_count || 1} chunks).`
        );
        setTimeout(() => setUploadFeedback(null), 6000);
      } else {
        setUploadFeedback(`Blocked: ${data.reason || data.message || 'File failed security check.'}`);
      }
    } catch (err) {
      setUploadFeedback(`Upload error: ${(err as Error).message}`);
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Remove Active Document from Session
  const handleRemoveActiveDocument = () => {
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThreadId ? { ...t, activeDocument: undefined } : t
      )
    );
  };

  // Send Query (RAG or Code Assist)
  const handleSendMessage = async (customQuery?: string) => {
    const queryText = (customQuery || inputQuery).trim();
    if (!queryText || isLoading) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThreadId
          ? {
              ...t,
              title: t.messages.length === 0 ? queryText.slice(0, 32) + '...' : t.title,
              messages: [...t.messages, userMessage],
            }
          : t
      )
    );

    setInputQuery('');
    setIsLoading(true);

    try {
      if (activeTab === 'code') {
        const res = await fetch(`${BACKEND_URL}/code/assist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: queryText,
            code: codeContext || undefined,
            language: codeLanguage,
            engine: codeEngine,
          }),
        });

        if (!res.ok) throw new Error(`Code Assist failed: ${res.statusText}`);
        const data = await res.json();

        const assistantMessage: Message = {
          id: `asst_${Date.now()}`,
          role: 'assistant',
          content: data.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          codeSnippet: data.code || undefined,
          codeLanguage: data.language || codeLanguage,
          thought_process: [
            `Engine: ${data.engine.toUpperCase()} LPU`,
            `Language: ${data.language}`,
            'Runnable AST extracted & validated',
          ],
          status: 'Code Generated',
        };

        setThreads((prev) =>
          prev.map((t) =>
            t.id === activeThreadId
              ? { ...t, messages: [...t.messages, assistantMessage] }
              : t
          )
        );
      } else {
        const res = await fetch(`${BACKEND_URL}/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: queryText,
            thread_id: activeThreadId,
            persona,
            system_prompt: systemPrompt || undefined,
            temperature,
            top_k: topK,
            filename: activeThread.activeDocument?.filename || undefined,
          }),
        });

        if (!res.ok) throw new Error(`RAG Query failed: ${res.statusText}`);
        const data = await res.json();

        const isBlocked = data.status?.toLowerCase().includes('blocked');

        const assistantMessage: Message = {
          id: `asst_${Date.now()}`,
          role: 'assistant',
          content: data.answer || 'No response synthesized.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          thought_process: data.thought_process || [],
          sources: data.sources || [],
          status: data.status || 'Complete',
          isGuardrailBlocked: isBlocked,
        };

        setThreads((prev) =>
          prev.map((t) =>
            t.id === activeThreadId
              ? { ...t, messages: [...t.messages, assistantMessage] }
              : t
          )
        );
      }
    } catch (err) {
      const errorMessage: Message = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `Error connecting to backend: ${(err as Error).message}. Please ensure the FastAPI server is running on ${BACKEND_URL}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'Connection Error',
      };
      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThreadId
            ? { ...t, messages: [...t.messages, errorMessage] }
            : t
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleThoughts = (id: string) => {
    setExpandedThoughts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex h-screen w-full bg-[#0a0a0d] text-neutral-200 overflow-hidden font-sans select-none antialiased relative">
      {/* -------------------- MOBILE BACKDROP OVERLAY -------------------- */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-30 lg:hidden transition-opacity"
        />
      )}

      {/* -------------------- LEFT SIDEBAR (COLLAPSIBLE & RESPONSIVE) -------------------- */}
      <aside
        className={`bg-[#121217] border-r border-neutral-800 flex flex-col justify-between shrink-0 z-40 transition-all duration-300 ease-in-out ${
          isSidebarOpen
            ? 'fixed inset-y-0 left-0 w-72 sm:w-80 translate-x-0 shadow-2xl lg:static lg:shadow-none'
            : 'fixed inset-y-0 left-0 w-72 sm:w-80 -translate-x-full lg:w-0 lg:translate-x-0 lg:p-0 lg:overflow-hidden lg:border-r-0 lg:opacity-0'
        }`}
      >
        {/* Top Header / Branding */}
        <div className="p-4 border-b border-neutral-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onBack}
              className="px-2.5 py-1 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer text-xs font-mono"
              title="Return to Landing Page"
            >
              Back
            </button>
            <div>
              <h2 className="text-base font-bold tracking-wide text-neutral-100 dancing-script">
                Cognivault Studio
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleNewThread}
              className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white transition-all cursor-pointer text-xs font-mono"
              title="Start New Thread"
            >
              + New
            </button>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="px-2 py-1 rounded-lg text-xs font-mono text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Hide Sidebar"
            >
              Hide
            </button>
          </div>
        </div>

        {/* Scrollable Sidebar Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Active Document Ingestion Hub */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-400">
                Active Knowledge Doc
              </span>
            </div>

            {activeThread.activeDocument ? (
              <div className="p-3 rounded-xl bg-[#181820] border border-blue-500/30 flex items-start justify-between gap-2">
                <div className="overflow-hidden">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-blue-300 truncate">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-blue-950 text-blue-300 border border-blue-800/60 font-semibold">
                      DOC
                    </span>
                    <span className="truncate">{activeThread.activeDocument.filename}</span>
                  </div>
                  <p className="text-[10px] font-mono text-neutral-400 mt-1">
                    {activeThread.activeDocument.chunksCount || 1} chunks • Qdrant HNSW Indexed
                  </p>
                </div>
                <button
                  onClick={handleRemoveActiveDocument}
                  className="text-neutral-400 hover:text-white text-xs font-mono px-1.5 py-0.5 rounded hover:bg-neutral-800 transition-colors cursor-pointer"
                  title="Remove Document"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`p-3 rounded-xl border border-dashed border-neutral-700/80 hover:border-neutral-500 bg-[#15151a] hover:bg-[#191920] cursor-pointer transition-colors text-center ${
                  uploadingFile ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.md,.py,.json,.csv,.html,.xml,.yaml,.yml,.sh,.sql"
                />
                <p className="text-xs text-neutral-200 font-medium font-mono">Upload Knowledge File</p>
                <p className="text-[10px] text-neutral-400 font-mono mt-1">
                  PDF • DOCX • TXT • MD • PPT • PY
                </p>
              </div>
            )}

            {uploadFeedback && (
              <div
                className={`text-[11px] font-mono p-2.5 rounded-lg border animate-fade-in ${
                  uploadFeedback.startsWith('Blocked') || uploadFeedback.startsWith('Upload error')
                    ? 'text-rose-300 bg-rose-950/50 border-rose-800/60'
                    : 'text-emerald-300 bg-emerald-950/40 border-emerald-800/40'
                }`}
              >
                <span className="font-semibold block mb-0.5">
                  {uploadFeedback.startsWith('Blocked') || uploadFeedback.startsWith('Upload error')
                    ? '[SECURITY INTERCEPTION]'
                    : '[INDEXED SUCCESSFULLY]'}
                </span>
                <span className="leading-snug block">{uploadFeedback}</span>
              </div>
            )}
          </div>

          {/* Persona Selector */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-400">
              Agent Persona
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {PERSONAS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPersona(p.id)}
                  className={`text-left px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    persona === p.id
                      ? 'bg-neutral-800 text-white border border-neutral-600/70 shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40 border border-transparent'
                  }`}
                >
                  <div className="font-semibold text-neutral-200">{p.label}</div>
                  <div className="text-[10px] text-neutral-400 font-mono truncate">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Conversation Sessions List */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-400">
              Recent Threads
            </span>
            <div className="space-y-1">
              {threads.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveThreadId(t.id);
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs truncate transition-colors cursor-pointer flex items-center justify-between ${
                    t.id === activeThreadId
                      ? 'bg-neutral-800 text-white font-medium border border-neutral-700/60'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/30'
                  }`}
                >
                  <span className="truncate">{t.title}</span>
                  <span className="text-[10px] font-mono text-neutral-500 shrink-0 ml-2">
                    {t.createdAt}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* -------------------- MAIN CHAT AREA -------------------- */}
      <div className="flex-1 flex flex-col h-full bg-[#09090c] overflow-hidden relative">
        {/* Top Navbar */}
        <header className="h-14 px-3 sm:px-6 flex items-center justify-between bg-[#111116]/95 backdrop-blur-md shrink-0 z-10 gap-2">
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {/* Sidebar Toggle Button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-mono bg-neutral-800/90 hover:bg-neutral-700 text-neutral-200 hover:text-white border border-neutral-700/60 transition-colors cursor-pointer shrink-0"
              title={isSidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
            >
              {isSidebarOpen ? 'Hide Sidebar' : 'Sidebar'}
            </button>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center p-0.5 rounded-xl bg-neutral-900 border border-neutral-800 shrink-0">
              <button
                onClick={() => setActiveTab('rag')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                  activeTab === 'rag'
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Agentic RAG
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                  activeTab === 'code'
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Code Studio
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowGraphModal(true)}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 hover:text-white text-xs font-mono border border-neutral-700/50 cursor-pointer transition-colors"
            >
              Workflow Graph
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 hover:text-white border border-neutral-700/50 cursor-pointer transition-colors text-xs font-mono"
            >
              Parameters
            </button>
          </div>
        </header>

        {/* Messages Viewport */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-8 py-4 sm:py-6 space-y-6">
          {activeThread.messages.length === 0 ? (
            /* Clean Empty State Hero */
            <div className="max-w-3xl mx-auto my-auto py-12 flex flex-col items-center text-center space-y-6">
              <div>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white dancing-script">
                  Cognivault
                </h1>
              </div>

              {/* Starter Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl text-left pt-2">
                {STARTER_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(p.query)}
                    className="p-3.5 rounded-xl bg-[#141419] hover:bg-[#1b1b22] border border-neutral-800 hover:border-neutral-700 text-left transition-all cursor-pointer group"
                  >
                    <div className="text-xs font-semibold text-neutral-200 group-hover:text-white">
                      {p.title}
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                      {p.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Active Messages List */
            activeThread.messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-4xl mx-auto flex flex-col ${
                  m.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                {/* User Message Bubble */}
                {m.role === 'user' ? (
                  <div className="max-w-[92%] sm:max-w-[85%] rounded-2xl px-5 py-3.5 bg-[#202027] border border-neutral-700/70 text-neutral-100 shadow-md">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                    <span className="text-[10px] font-mono text-neutral-400 mt-1.5 block text-right">
                      {m.timestamp}
                    </span>
                  </div>
                ) : (
                  /* Assistant Message Card */
                  <div className="w-full rounded-2xl p-4 sm:p-5 bg-[#141419] border border-neutral-800 shadow-lg space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-neutral-200">
                          LangGraph StateGraph
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700">
                          {persona}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(m.content, m.id)}
                          className="text-neutral-400 hover:text-white px-2 py-0.5 rounded hover:bg-neutral-800 transition-colors cursor-pointer text-[11px] font-mono"
                          title="Copy Answer"
                        >
                          {copiedId === m.id ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    {/* Execution Reasoning / Thoughts Accordion */}
                    {m.thought_process && m.thought_process.length > 0 && (
                      <div className="rounded-xl border border-neutral-800 bg-[#0e0e12] overflow-hidden">
                        <button
                          onClick={() => toggleThoughts(m.id)}
                          className="w-full px-3.5 py-2 flex items-center justify-between text-xs font-mono text-neutral-300 hover:text-white cursor-pointer bg-neutral-900/50"
                        >
                          <span>
                            {expandedThoughts[m.id] ? '[–] Reasoning Trace' : '[+] Reasoning Trace'}{' '}
                            ({m.thought_process.length} steps)
                          </span>
                          <span className="text-[10px] text-neutral-500">
                            {expandedThoughts[m.id] ? 'Collapse' : 'Expand'}
                          </span>
                        </button>

                        {expandedThoughts[m.id] && (
                          <div className="p-3 border-t border-neutral-800 space-y-1.5 font-mono text-[11px]">
                            {m.thought_process.map((step, sIdx) => (
                              <div
                                key={sIdx}
                                className="flex items-start gap-2 text-neutral-300 bg-[#16161d] p-2 rounded"
                              >
                                <span className="text-purple-400 font-bold shrink-0">
                                  {`0${sIdx + 1}`}.
                                </span>
                                <span>{step}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Guardrails Alert Banner if Blocked */}
                    {m.isGuardrailBlocked && (
                      <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200">
                        <h4 className="text-xs font-mono font-semibold">
                          [SAFETY INTERCEPTION: NeMo Guardrails Activated]
                        </h4>
                        <p className="text-xs text-amber-300/90 mt-1 leading-relaxed">
                          This prompt was flagged by the zero-trust safety rail for policy
                          intervention or injection defense.
                        </p>
                      </div>
                    )}

                    {/* Formatted Markdown Answer Content */}
                    <div className="w-full overflow-hidden">
                      <MarkdownRenderer content={m.content} />
                    </div>

                    {/* Code Studio Code Snippet (if any) */}
                    {m.codeSnippet && (
                      <div className="pt-2">
                        <div className="text-xs font-mono text-neutral-400 mb-1.5 flex items-center justify-between">
                          <span>Verified AST Output ({m.codeLanguage})</span>
                        </div>
                        <CodeBlock
                          language={m.codeLanguage || 'python'}
                          filename={`solution.${m.codeLanguage === 'typescript' ? 'ts' : m.codeLanguage === 'javascript' ? 'js' : 'py'}`}
                          code={m.codeSnippet}
                        />
                      </div>
                    )}

                    {/* Sources Provenance Section */}
                    {m.sources && m.sources.length > 0 && (
                      <div className="pt-3 border-t border-neutral-800/80">
                        <span className="text-[11px] font-mono text-neutral-400 font-semibold block mb-2">
                          Sources & Citations ({m.sources.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {m.sources.map((src, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 rounded-md bg-[#191920] border border-neutral-800 text-[11px] font-mono text-blue-300"
                            >
                              [Ref {idx + 1}] {src}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-[10px] font-mono text-neutral-500 pt-1 flex items-center justify-between">
                      <span>Status: {m.status || 'Complete'}</span>
                      <span>{m.timestamp}</span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="max-w-4xl mx-auto flex items-center gap-3 p-4 rounded-xl bg-[#141419] border border-neutral-800 text-neutral-300">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
              <span className="text-xs font-mono">
                {activeTab === 'code'
                  ? 'Compiling code solution via Groq LPU...'
                  : 'Orchestrating LangGraph StateGraph • Querying Qdrant • Reranking via FlashRank...'}
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* -------------------- BOTTOM QUERY INPUT AREA -------------------- */}
        <div className="p-3 sm:p-6 shrink-0 bg-transparent">
          <div className="max-w-4xl mx-auto space-y-2">
            {/* Optional Code Context Input Box (Code Studio Mode) */}
            {activeTab === 'code' && showCodeContextInput && (
              <div className="p-3 rounded-xl bg-[#15151a] border border-neutral-700/60 space-y-2 animate-fade-in">
                <div className="flex items-center justify-between text-xs font-mono text-neutral-300">
                  <span>Target Code Context</span>
                  <button
                    onClick={() => setShowCodeContextInput(false)}
                    className="text-neutral-400 hover:text-white cursor-pointer text-xs"
                  >
                    Close
                  </button>
                </div>
                <textarea
                  value={codeContext}
                  onChange={(e) => setCodeContext(e.target.value)}
                  placeholder="// Paste existing code snippet for debug, refactor, or optimization..."
                  className="w-full h-20 bg-[#0d0d10] rounded-lg p-2 font-mono text-xs text-neutral-200 border border-neutral-700/60 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            )}

            {/* Input Bar Container */}
            <div className="relative rounded-2xl bg-[#17171d] border border-neutral-700/70 p-2 shadow-xl focus-within:border-neutral-500 transition-colors">
              <textarea
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  activeTab === 'code'
                    ? 'Ask a coding question, optimization goal, or debug request...'
                    : activeThread.activeDocument
                    ? `Query against ${activeThread.activeDocument.filename} or knowledge base...`
                    : 'Query knowledge base (e.g., SRIOV, HNSW clustering, guardrails)...'
                }
                rows={2}
                className="w-full bg-transparent px-3 py-1.5 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none resize-none font-sans"
              />

              <div className="flex items-center justify-between pt-1 px-2">
                <div className="flex items-center gap-2">
                  {/* File Upload Trigger */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer border border-neutral-700/60"
                    title="Upload Document (PDF, DOCS, PPT, TXT, MD, PYTHON)"
                  >
                    Attach File
                  </button>

                  {/* Code Context Toggle (In Code Mode) */}
                  {activeTab === 'code' && (
                    <button
                      onClick={() => setShowCodeContextInput(!showCodeContextInput)}
                      className={`px-2 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer border ${
                        showCodeContextInput
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : 'bg-neutral-800 text-neutral-300 hover:text-white border-neutral-700/60'
                      }`}
                    >
                      {showCodeContextInput ? 'Context Active' : '+ Context'}
                    </button>
                  )}

                  {/* Active Document Tag */}
                  {activeThread.activeDocument && (
                    <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-950/70 border border-blue-800/60 text-[10px] font-mono text-blue-300">
                      <span>Doc: {activeThread.activeDocument.filename}</span>
                    </span>
                  )}
                </div>

                {/* Send Button */}
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputQuery.trim() || isLoading}
                  className="px-4 py-1.5 rounded-xl bg-white text-black hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed font-semibold text-xs transition-all cursor-pointer shadow-md active:scale-95"
                >
                  Send
                </button>
              </div>
            </div>

            {/* Bottom Telemetry Bar */}
            <div className="flex items-center justify-between px-1 text-[10px] font-mono text-neutral-500">
              <span>Enter to send • Shift+Enter for new line</span>
              <span className="hidden sm:inline">Session: {activeThreadId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------- RAG PARAMETERS DRAWER -------------------- */}
      {showSettings && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-[#141419] border-l border-neutral-800 shadow-2xl z-50 p-6 flex flex-col justify-between animate-in slide-in-from-right duration-200 max-w-[100vw]">
          <div className="space-y-6 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-100">
                RAG Engine Parameters
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-neutral-400 hover:text-white text-xs font-mono px-2 py-1 rounded bg-neutral-800 cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Temperature Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-300">Temperature</span>
                <span className="text-blue-400 font-semibold">{temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <p className="text-[10px] text-neutral-500 font-mono">
                0.0 = Deterministic/Factual • 1.0 = Creative/Exploratory
              </p>
            </div>

            {/* Top-K Chunks Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-300">Top-K Context Chunks</span>
                <span className="text-blue-400 font-semibold">{topK}</span>
              </div>
              <input
                type="range"
                min="1"
                max="15"
                step="1"
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <p className="text-[10px] text-neutral-500 font-mono">
                Number of Qdrant vector chunks to rerank via FlashRank
              </p>
            </div>

            {/* Custom System Instruction */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-neutral-300 block">
                Custom System Prompt
              </label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="e.g., Focus specifically on hardware bypass, memory layout, and latency."
                rows={3}
                className="w-full bg-[#0d0d10] border border-neutral-700/60 rounded-xl p-2.5 text-xs text-neutral-200 focus:outline-none focus:border-blue-500 resize-none font-sans"
              />
            </div>

            {/* Code Studio Defaults */}
            <div className="space-y-3 pt-3 border-t border-neutral-800">
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold block">
                Code Studio Engine
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setCodeEngine('groq')}
                  className={`p-2 rounded-xl text-xs font-mono border text-center cursor-pointer transition-all ${
                    codeEngine === 'groq'
                      ? 'bg-amber-950/40 border-amber-600 text-amber-300'
                      : 'border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  Groq LPU
                </button>
                <button
                  onClick={() => setCodeEngine('gemini')}
                  className={`p-2 rounded-xl text-xs font-mono border text-center cursor-pointer transition-all ${
                    codeEngine === 'gemini'
                      ? 'bg-blue-950/40 border-blue-600 text-blue-300'
                      : 'border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  Gemini Flash
                </button>
              </div>

              {/* Code Studio Language */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold block">
                  Target Language
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {['python', 'javascript', 'typescript', 'rust', 'go', 'sql'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setCodeLanguage(lang)}
                      className={`py-1 px-2 rounded-lg text-[11px] font-mono border text-center cursor-pointer transition-all ${
                        codeLanguage === lang
                          ? 'bg-amber-950/40 border-amber-600 text-amber-300 font-semibold'
                          : 'border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-800">
            <button
              onClick={() => setShowSettings(false)}
              className="w-full py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              Apply Settings
            </button>
          </div>
        </div>
      )}

      {/* -------------------- AI WORKFLOW GRAPH MODAL -------------------- */}
      {showGraphModal && (
        <AiWorkflowGraph
          onClose={() => setShowGraphModal(false)}
          backendUrl={BACKEND_URL}
        />
      )}
    </div>
  );
};

export default RagChatbotPage;
