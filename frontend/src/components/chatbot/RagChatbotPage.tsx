import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Send,
  Paperclip,
  Sliders,
  Plus,
  Check,
  Copy,
  FileText,
  Shield,
  ShieldAlert,
  Terminal,
  Layers,
  X,
  ChevronDown,
  ChevronRight,
  Code,
  Database,
  Brain,
  FileCheck,
} from 'lucide-react';
import { CodeBlock } from '@/components/ui/code-block';
import MarkdownRenderer from './MarkdownRenderer';

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

interface BackendHealth {
  status: 'online' | 'offline' | 'checking';
  latencyMs: number;
  service?: string;
}

const BACKEND_URL = 'http://localhost:8000';

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

  // Backend Health
  const [health, setHealth] = useState<BackendHealth>({ status: 'checking', latencyMs: 0 });

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

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages, isLoading]);

  // Check Backend Health
  const checkHealth = async () => {
    const start = performance.now();
    try {
      const res = await fetch(`${BACKEND_URL}/health`);
      const latency = Math.round(performance.now() - start);
      if (res.ok) {
        const data = await res.json();
        setHealth({ status: 'online', latencyMs: latency, service: data.service });
      } else {
        setHealth({ status: 'offline', latencyMs: latency });
      }
    } catch {
      setHealth({ status: 'offline', latencyMs: 0 });
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 25000);
    return () => clearInterval(interval);
  }, []);

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
        // Update active thread with document metadata
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

    // Append user message immediately
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
        // Call Code Studio Copilot endpoint
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
        // Call Primary Agentic RAG endpoint
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
    <div className="flex h-screen w-full bg-[#0d0d10] text-neutral-200 overflow-hidden font-sans select-none antialiased">
      {/* -------------------- LEFT SIDEBAR -------------------- */}
      <aside className="w-72 sm:w-80 bg-[#131316] border-r border-neutral-800 flex flex-col justify-between shrink-0 z-20">
        {/* Top Header / Branding */}
        <div className="p-4 border-b border-neutral-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="Return to Landing Page"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-base font-bold tracking-wide text-neutral-200 dancing-script">
                Cognivault Studio
              </h2>
            </div>
          </div>

          <button
            onClick={handleNewThread}
            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white transition-all cursor-pointer flex items-center gap-1"
            title="Start New Thread"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="text-xs font-mono font-medium">New</span>
          </button>
        </div>

        {/* Scrollable Sidebar Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Active Document Ingestion Hub */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                Active Knowledge Doc
              </span>
            </div>

            {activeThread.activeDocument ? (
              <div className="p-3 rounded-xl bg-[#1b1b20] border border-blue-500/30 flex items-start justify-between gap-2">
                <div className="overflow-hidden">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-blue-300 truncate">
                    <FileCheck className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                    <span className="truncate">{activeThread.activeDocument.filename}</span>
                  </div>
                  <p className="text-[10px] font-mono text-neutral-400 mt-1">
                    {activeThread.activeDocument.chunksCount || 1} chunks • Qdrant HNSW Indexed
                  </p>
                </div>
                <button
                  onClick={handleRemoveActiveDocument}
                  className="text-neutral-400 hover:text-neutral-200 p-1 cursor-pointer"
                  title="Remove Document"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`p-3 rounded-xl border border-dashed border-neutral-700/80 hover:border-neutral-500 bg-[#16161a] hover:bg-[#1a1a1f] cursor-pointer transition-colors text-center ${
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
                <Paperclip className="w-4 h-4 mx-auto text-neutral-400 mb-1" />
                <p className="text-xs text-neutral-300 font-medium">Upload Document for RAG</p>
                <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                  TXT • DOCS • PDF • MD • PPT • PYTHON
                </p>
              </div>
            )}

            {uploadFeedback && (
              <div
                className={`text-[11px] font-mono p-2 rounded-lg border animate-fade-in flex items-start gap-1.5 ${
                  uploadFeedback.startsWith('Blocked') || uploadFeedback.startsWith('Upload error')
                    ? 'text-rose-300 bg-rose-950/50 border-rose-800/60'
                    : 'text-emerald-300 bg-emerald-950/40 border-emerald-800/40'
                }`}
              >
                {uploadFeedback.startsWith('Blocked') || uploadFeedback.startsWith('Upload error') ? (
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                )}
                <span className="leading-snug">{uploadFeedback}</span>
              </div>
            )}
          </div>

          {/* Persona Selector */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-purple-400" />
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
                  onClick={() => setActiveThreadId(t.id)}
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

        {/* Sidebar Footer - System Health */}
        <div className="p-4 border-t border-neutral-800/80 bg-[#111114] space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-neutral-400 flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  health.status === 'online'
                    ? 'bg-emerald-500'
                    : health.status === 'checking'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
              />
              Backend API
            </span>
            <span
              className={
                health.status === 'online'
                  ? 'text-emerald-400 font-semibold'
                  : 'text-neutral-500'
              }
            >
              {health.status === 'online' ? `200 OK (${health.latencyMs}ms)` : health.status}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              NeMo Guardrails
            </span>
            <span className="text-blue-400 font-medium">Active</span>
          </div>
        </div>
      </aside>

      {/* -------------------- MAIN CHAT AREA -------------------- */}
      <div className="flex-1 flex flex-col h-full bg-[#0f0f12] overflow-hidden relative">
        {/* Top Navbar */}
        <header className="h-14 px-6 border-b border-neutral-800 flex items-center justify-between bg-[#131317]/90 backdrop-blur-md shrink-0 z-10">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-900 border border-neutral-800">
            <button
              onClick={() => setActiveTab('rag')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'rag'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-blue-400" />
              Agentic RAG
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'code'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              Code Studio Copilot
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowGraphModal(true)}
              className="px-3 py-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-mono flex items-center gap-1.5 border border-neutral-700/50 cursor-pointer transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Workflow Graph</span>
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700/50 cursor-pointer transition-colors"
              title="RAG Parameters"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Messages Viewport */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
          {activeThread.messages.length === 0 ? (
            /* Empty State Hero */
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
                    className="p-3.5 rounded-xl bg-[#16161a] hover:bg-[#1f1f26] border border-neutral-800 hover:border-neutral-700 text-left transition-all cursor-pointer group"
                  >
                    <div className="text-xs font-semibold text-neutral-200 group-hover:text-white flex items-center justify-between">
                      {p.title}
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-300" />
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2">{p.desc}</p>
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
                  <div className="max-w-[85%] rounded-2xl px-5 py-3.5 bg-[#25252b] border border-neutral-700/70 text-neutral-100 shadow-md">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                    <span className="text-[10px] font-mono text-neutral-400 mt-1 block text-right">
                      {m.timestamp}
                    </span>
                  </div>
                ) : (
                  /* Assistant Message Card */
                  <div className="w-full rounded-2xl p-5 bg-[#17171c] border border-neutral-800 shadow-lg space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
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
                          className="text-neutral-400 hover:text-white p-1 rounded transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-mono"
                          title="Copy Answer"
                        >
                          {copiedId === m.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Execution Reasoning / Thoughts Accordion */}
                    {m.thought_process && m.thought_process.length > 0 && (
                      <div className="rounded-xl border border-neutral-800 bg-[#121215] overflow-hidden">
                        <button
                          onClick={() => toggleThoughts(m.id)}
                          className="w-full px-3.5 py-2 flex items-center justify-between text-xs font-mono text-neutral-400 hover:text-neutral-200 cursor-pointer bg-neutral-900/50"
                        >
                          <span className="flex items-center gap-1.5">
                            <Brain className="w-3.5 h-3.5 text-purple-400" />
                            Agent Trajectory & Reasoning Steps ({m.thought_process.length})
                          </span>
                          {expandedThoughts[m.id] ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {expandedThoughts[m.id] && (
                          <div className="p-3 border-t border-neutral-800 space-y-1.5 font-mono text-[11px]">
                            {m.thought_process.map((step, sIdx) => (
                              <div
                                key={sIdx}
                                className="flex items-start gap-2 text-neutral-300 bg-[#17171d] p-1.5 rounded"
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
                      <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-start gap-3 text-amber-200">
                        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-semibold">
                            Interception: NeMo Guardrails Activated
                          </h4>
                          <p className="text-xs text-amber-300/90 mt-0.5">
                            This prompt was flagged by the zero-trust safety rail for policy
                            intervention or injection risk.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Formatted Markdown Answer Content */}
                    <div className="w-full overflow-hidden">
                      <MarkdownRenderer content={m.content} />
                    </div>

                    {/* Additional Runnable Code Snippet (if separate from content) */}
                    {m.codeSnippet && !m.content.includes(m.codeSnippet.slice(0, 30)) && (
                      <div className="pt-2">
                        <CodeBlock
                          language={m.codeLanguage || 'python'}
                          filename={`solution.${m.codeLanguage === 'python' ? 'py' : 'js'}`}
                          code={m.codeSnippet}
                        />
                      </div>
                    )}

                    {/* Cited Sources Footer */}
                    {m.sources && m.sources.length > 0 && (
                      <div className="pt-2 border-t border-neutral-800/60 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-mono uppercase text-neutral-500 font-semibold mr-1">
                          Sources Cited:
                        </span>
                        {m.sources.map((src, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-800/80 border border-neutral-700/60 text-[10px] font-mono text-neutral-300"
                          >
                            <FileText className="w-3 h-3 text-blue-400" />
                            {src}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="max-w-4xl mx-auto flex items-start gap-3 p-4 rounded-xl bg-[#17171c] border border-neutral-800">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping mt-1" />
              <div className="space-y-1">
                <p className="text-xs font-mono font-medium text-neutral-300">
                  {activeTab === 'code'
                    ? `Synthesizing code with ${codeEngine.toUpperCase()} LPU...`
                    : 'Executing LangGraph Agent (Guardrails → Qdrant Vector Retrieval → FlashRank Reranking → Synthesis)...'}
                </p>
                <p className="text-[10px] font-mono text-neutral-500">
                  MemorySaver persistence thread: {activeThreadId}
                </p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* -------------------- BOTTOM INPUT BAR -------------------- */}
        <div className="p-4 sm:p-6 bg-[#131317]/90 border-t border-neutral-800 shrink-0">
          <div className="max-w-4xl mx-auto space-y-2">
            {/* Code Studio Optional Snippet Input */}
            {activeTab === 'code' && showCodeContextInput && (
              <div className="p-3 rounded-xl bg-[#18181e] border border-neutral-800 space-y-1.5 animate-fade-in">
                <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
                  <span>Existing Code Snippet (Optional context for debug / refactor):</span>
                  <button
                    onClick={() => setShowCodeContextInput(false)}
                    className="text-neutral-500 hover:text-neutral-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <textarea
                  value={codeContext}
                  onChange={(e) => setCodeContext(e.target.value)}
                  placeholder="// Paste your code snippet here..."
                  className="w-full h-20 bg-[#121215] rounded-lg p-2 font-mono text-xs text-neutral-200 border border-neutral-700/60 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            )}

            {/* Input Bar Container */}
            <div className="relative rounded-2xl bg-[#1a1a20] border border-neutral-700/70 p-2 shadow-xl focus-within:border-neutral-500 transition-colors">
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
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                    title="Upload Document (PDF, DOCS, PPT, TXT, MD, PYTHON)"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  {/* Code Context Toggle (In Code Mode) */}
                  {activeTab === 'code' && (
                    <button
                      onClick={() => setShowCodeContextInput(!showCodeContextInput)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-mono transition-colors cursor-pointer flex items-center gap-1 ${
                        showCodeContextInput
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                      }`}
                    >
                      <Code className="w-3.5 h-3.5" />
                      <span>{showCodeContextInput ? 'Context Active' : '+ Code Context'}</span>
                    </button>
                  )}

                  {/* Active Document Tag */}
                  {activeThread.activeDocument && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-950/60 border border-blue-800/60 text-[10px] font-mono text-blue-300">
                      <FileCheck className="w-3 h-3 text-blue-400" />
                      {activeThread.activeDocument.filename}
                    </span>
                  )}
                </div>

                {/* Send Button */}
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputQuery.trim() || isLoading}
                  className="px-4 py-1.5 rounded-xl bg-white text-black hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed font-semibold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Bottom Telemetry Bar */}
            <div className="flex items-center justify-between px-1 text-[10px] font-mono text-neutral-500">
              <span>Enter to send • Shift+Enter for new line</span>
              <span>Session: {activeThreadId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------- RAG PARAMETERS DRAWER -------------------- */}
      {showSettings && (
        <div className="fixed inset-y-0 right-0 w-80 sm:w-96 bg-[#16161b] border-l border-neutral-800 shadow-2xl z-30 p-6 flex flex-col justify-between animate-in slide-in-from-right duration-200">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-200 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                RAG Engine Settings
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
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
                className="w-full bg-[#111114] border border-neutral-700/60 rounded-xl p-2.5 text-xs text-neutral-200 focus:outline-none focus:border-blue-500 resize-none font-sans"
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

      {/* -------------------- WORKFLOW GRAPH MODAL -------------------- */}
      {showGraphModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-[#17171d] rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <h3 className="font-mono text-sm font-bold text-white">
                  LangGraph Agentic Workflow Graph
                </h3>
              </div>
              <button
                onClick={() => setShowGraphModal(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-[#0e0e11]">
              <img
                src={`${BACKEND_URL}/graph`}
                alt="LangGraph Architecture Workflow"
                className="max-w-full max-h-[500px] object-contain rounded-lg border border-neutral-800 shadow-inner bg-black/40"
              />
              <p className="text-xs font-mono text-neutral-400 mt-4 text-center max-w-xl">
                Dynamic cyclic state machine: Planner node classifies intents, evaluates NeMo Guardrails,
                retrieves multi-vector embeddings from Qdrant, and reranks via FlashRank cross-encoder.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RagChatbotPage;
