import React, { useState } from 'react';
import { API_BASE_URL } from '@/config';

interface AiWorkflowGraphProps {
  onClose: () => void;
  backendUrl?: string;
}

interface NodeData {
  id: string;
  name: string;
  category: 'Input' | 'Security' | 'Orchestration' | 'Retrieval' | 'Neural' | 'Synthesis' | 'Telemetry';
  badge: string;
  description: string;
  specs: { label: string; val: string }[];
  status: 'Ready' | 'Active' | 'Complete' | 'Guarded';
}

const NODES: NodeData[] = [
  {
    id: 'input',
    name: 'Query & Ingestion Hub',
    category: 'Input',
    badge: 'STAGE 01',
    description: 'Ingests user prompt and multi-format files (PDF, DOCX, TXT, PY). Extracts text, calculates token budgets, and normalizes encodings.',
    specs: [
      { label: 'Supported Formats', val: 'PDF, DOCX, TXT, MD, PPT, PY' },
      { label: 'Chunking Strategy', val: 'Semantic Token Window (500t)' },
      { label: 'Context Buffer', val: 'Multi-turn Memory Checkpoint' },
    ],
    status: 'Ready',
  },
  {
    id: 'guardrail',
    name: 'Zero-Trust Safety Gate',
    category: 'Security',
    badge: 'GATE 01',
    description: 'First defensive barrier. Evaluates input against injection patterns, script injection, jailbreak keywords, and semantic safety rules before execution.',
    specs: [
      { label: 'Latency Overhead', val: '< 2.4 ms (Zero-Trust)' },
      { label: 'Policy Model', val: 'Deterministic Regex + Cloud Guard' },
      { label: 'Action on Breach', val: 'Immediate Safe Refusal' },
    ],
    status: 'Guarded',
  },
  {
    id: 'planner',
    name: 'LangGraph State Planner',
    category: 'Orchestration',
    badge: 'CORE ENGINE',
    description: 'StateGraph cyclic controller. Classifies intent, coordinates sub-agent routing, detects cycles, and tracks conversational state transitions.',
    specs: [
      { label: 'State Machine', val: 'LangGraph Cyclic DAG' },
      { label: 'Memory Driver', val: 'MemorySaver Checkpointer' },
      { label: 'Branching', val: 'Conditional Intent Dispatcher' },
    ],
    status: 'Active',
  },
  {
    id: 'retrieval',
    name: 'Hybrid Dense & Sparse Search',
    category: 'Retrieval',
    badge: 'STAGE 02',
    description: 'Generates high-dimensional semantic vectors via Gemini (3072-dim) with local Sentence-Transformers failover, joined with sparse lexical tokenization.',
    specs: [
      { label: 'Dense Embeddings', val: 'Gemini 3072d / all-mpnet 768d' },
      { label: 'Similarity Metric', val: 'Cosine Distance' },
      { label: 'Sparse Alignment', val: 'BM25 Lexical Keyword Boost' },
    ],
    status: 'Ready',
  },
  {
    id: 'qdrant',
    name: 'Qdrant Vector Engine',
    category: 'Retrieval',
    badge: 'STORAGE',
    description: 'High-throughput HNSW indexed vector database. Performs clustered nearest-neighbor search with multi-tenant payload isolation.',
    specs: [
      { label: 'Index Architecture', val: 'Hierarchical Navigable Small World' },
      { label: 'Payload Filtering', val: 'Thread ID + Filename Scope' },
      { label: 'Top-K Retrieval', val: '5 to 15 Vector Chunks' },
    ],
    status: 'Ready',
  },
  {
    id: 'reranker',
    name: 'FlashRank Cross-Encoder',
    category: 'Neural',
    badge: 'GATE 02',
    description: 'Ultra-fast neural cross-encoder. Evaluates query-document joint attention, filters hallucinated or low-relevance chunks, and recalibrates ranking.',
    specs: [
      { label: 'Model', val: 'ms-marco-MiniLM-L-12-v2' },
      { label: 'Inference Target', val: 'Local CPU Rerank (<15ms)' },
      { label: 'Precision Boost', val: '+38% Relevance Precision' },
    ],
    status: 'Active',
  },
  {
    id: 'synthesis',
    name: 'Cognitive LLM Synthesis',
    category: 'Synthesis',
    badge: 'STAGE 03',
    description: 'Synthesizes factual, grounded answers using Groq LPU Llama 3.3 70B (or Gemini 1.5 Flash). Enforces strict source citation and markdown formatting.',
    specs: [
      { label: 'Primary Engine', val: 'Groq LPU (Llama-3.3-70b-versatile)' },
      { label: 'Token Speed', val: '280+ tokens/sec' },
      { label: 'Grounding Rule', val: 'Zero-Hallucination Strict Context' },
    ],
    status: 'Ready',
  },
  {
    id: 'telemetry',
    name: 'Logfire Tracing & Audit',
    category: 'Telemetry',
    badge: 'OBSERVABILITY',
    description: 'Continuous OpenTelemetry tracking. Records end-to-end latency, tokens consumed, safety decisions, and per-step thought processes.',
    specs: [
      { label: 'Tracing Standard', val: 'Pydantic Logfire / OpenTelemetry' },
      { label: 'Audit Trail', val: 'Zero-Leakage Parameter Logs' },
      { label: 'Latency Profiling', val: 'Per-node Millisecond Budget' },
    ],
    status: 'Complete',
  },
];

export const AiWorkflowGraph: React.FC<AiWorkflowGraphProps> = ({
  onClose,
  backendUrl = API_BASE_URL,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('planner');
  const [viewMode, setViewMode] = useState<'neural' | 'backend' | 'trace'>('neural');

  const selectedNode = NODES.find((n) => n.id === selectedNodeId) || NODES[2];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2.5 sm:p-6 animate-fade-in">
      <div className="w-full max-w-5xl bg-[#111116] border border-neutral-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[95dvh]">
        {/* Modal Top Bar */}
        <div className="px-3.5 sm:px-6 py-3 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#141419]">
          <div className="flex items-center justify-between sm:justify-start gap-2.5">
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-neutral-200 truncate">
              Cognivault Architecture
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-400 border border-neutral-700/60">
              LangGraph StateGraph
            </span>
            <button
              onClick={onClose}
              className="sm:hidden px-2 py-1 rounded-lg text-xs font-mono bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700/60 transition-colors cursor-pointer"
              title="Close"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center rounded-lg bg-neutral-900 border border-neutral-800 p-0.5 text-[11px] font-mono w-full sm:w-auto justify-between sm:justify-start">
              <button
                onClick={() => setViewMode('neural')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  viewMode === 'neural'
                    ? 'bg-neutral-800 text-white font-medium border border-neutral-700/60 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <span className="sm:hidden">DAG</span>
                <span className="hidden sm:inline">Interactive DAG</span>
              </button>
              <button
                onClick={() => setViewMode('backend')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  viewMode === 'backend'
                    ? 'bg-neutral-800 text-white font-medium border border-neutral-700/60 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <span className="sm:hidden">Mermaid</span>
                <span className="hidden sm:inline">Backend Mermaid</span>
              </button>
              <button
                onClick={() => setViewMode('trace')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  viewMode === 'trace'
                    ? 'bg-neutral-800 text-white font-medium border border-neutral-700/60 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <span className="sm:hidden">Cycle</span>
                <span className="hidden sm:inline">Execution Cycle</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="hidden sm:inline-block px-2.5 py-1 rounded-lg text-xs font-mono bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700/60 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* Modal Main Content */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 bg-[#0c0c10] flex flex-col gap-4 sm:gap-6">
          {viewMode === 'neural' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 flex-1">
              {/* Left Column: Interactive AI Neural Nodes Pipeline (8 cols) */}
              <div className="lg:col-span-8 flex flex-col gap-3 sm:gap-4">
                <div className="p-3 rounded-xl bg-[#131317] border border-neutral-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-400">
                    Topology: <span className="text-neutral-200">Cyclic State Machine</span>
                  </span>
                  <span className="text-neutral-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                    8 Subsystems Active
                  </span>
                </div>

                {/* Clean Subtle Nodes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  {NODES.map((node) => {
                    const isSelected = selectedNode.id === node.id;
                    return (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNodeId(node.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
                          isSelected
                            ? 'bg-[#18181f] border-neutral-600 shadow-sm'
                            : 'bg-[#121216] border-neutral-800/80 hover:border-neutral-700 hover:bg-[#15151a]'
                        }`}
                      >
                        <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800/60">
                          <span className="text-[10px] font-mono tracking-wider uppercase text-neutral-500">
                            {node.badge}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-medium bg-neutral-800/80 text-neutral-300 border border-neutral-700/60">
                            {node.status}
                          </span>
                        </div>

                        <div className="pt-2">
                          <h4 className="text-xs font-semibold text-neutral-100 font-mono group-hover:text-white transition-colors">
                            {node.name}
                          </h4>
                          <p className="text-[11px] text-neutral-400 font-sans line-clamp-2 mt-1 leading-snug">
                            {node.description}
                          </p>
                        </div>

                        <div className="pt-2.5 flex items-center justify-between text-[10px] font-mono text-neutral-500">
                          <span>{node.category}</span>
                          <span className={isSelected ? 'text-neutral-300 font-medium' : 'text-neutral-500 group-hover:text-neutral-300'}>
                            {isSelected ? '● Selected' : 'View details'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Node Inspector & Specifications (4 cols) */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <div className="p-4 rounded-xl bg-[#131317] border border-neutral-800/80 flex flex-col gap-4 sticky top-0">
                  <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                        Node Inspector
                      </span>
                      <h3 className="text-sm font-bold font-mono text-neutral-100 mt-0.5">
                        {selectedNode.name}
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700/60">
                      {selectedNode.badge}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-medium block mb-1">
                      Function & Responsibility
                    </span>
                    <p className="text-xs text-neutral-300 font-sans leading-relaxed">
                      {selectedNode.description}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-neutral-800/80">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-medium block">
                      Runtime Specifications
                    </span>
                    <div className="space-y-1.5 font-mono text-xs">
                      {selectedNode.specs.map((spec, sIdx) => (
                        <div
                          key={sIdx}
                          className="p-2.5 rounded-lg bg-[#0d0d11] border border-neutral-800/70 flex flex-col gap-0.5"
                        >
                          <span className="text-[10px] text-neutral-500 uppercase">{spec.label}</span>
                          <span className="text-neutral-200 font-medium text-xs">{spec.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0d0d11] border border-neutral-800/70 text-[10px] font-mono text-neutral-400 leading-normal">
                    Pipeline Clearance: Security verified prior to dispatch. Sub-second orchestration across checkpoints.
                  </div>
                </div>
              </div>
            </div>
          )}

          {viewMode === 'backend' && (
            <div className="flex flex-col items-center justify-center p-6 bg-[#121216] rounded-xl border border-neutral-800/80 min-h-[400px]">
              <div className="text-xs font-mono text-neutral-400 mb-4 text-center">
                Live StateGraph topology generated from LangGraph runtime:
              </div>
              <img
                src={`${backendUrl}/graph`}
                alt="LangGraph Architecture Workflow Diagram"
                className="max-w-full max-h-[500px] object-contain rounded-lg border border-neutral-800 bg-[#0a0a0d] p-4"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <p className="text-[11px] font-mono text-neutral-500 mt-4 text-center max-w-xl">
                Generated via `draw_mermaid_png()`. Reflects the executing agent graph in memory.
              </p>
            </div>
          )}

          {viewMode === 'trace' && (
            <div className="p-4 sm:p-6 bg-[#121216] rounded-xl border border-neutral-800/80 space-y-4 font-mono">
              <h4 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider">
                Full Agentic Execution Trajectory
              </h4>

              <div className="space-y-2.5">
                {[
                  {
                    step: '01. User Request Reception',
                    action: 'Prompt sanitized; multi-tenant thread token allocated.',
                    result: 'Session checkpoint initial state instantiated.',
                  },
                  {
                    step: '02. Zero-Trust Safety Gate',
                    action: 'Fast regex scan + cloud-backed safety policy evaluation.',
                    result: 'Safety clearance passed (or instant defensive refusal).',
                  },
                  {
                    step: '03. LangGraph StateGraph Routing',
                    action: 'State planner evaluates intent classification & conversational history.',
                    result: 'Dispatches retrieval intent branch.',
                  },
                  {
                    step: '04. Multi-Vector Qdrant Query',
                    action: '3072-dim embeddings searched over HNSW cluster with payload filter.',
                    result: 'Top candidates retrieved within 8ms.',
                  },
                  {
                    step: '05. FlashRank Cross-Encoder Rerank',
                    action: 'Joint attention cross-scoring filters hallucination risks.',
                    result: 'Top-5 high-confidence chunks isolated.',
                  },
                  {
                    step: '06. Grounded Cognitive Generation',
                    action: 'Groq LPU Llama-3.3 70B synthesizes response with strict source grounding.',
                    result: 'Answer formatted with code blocks and citation links.',
                  },
                  {
                    step: '07. OpenTelemetry Trace Commit',
                    action: 'Logfire registers token consumption, latency breakdown, and memory checkpoint.',
                    result: 'State committed to MemorySaver.',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-[#0d0d11] border border-neutral-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2"
                  >
                    <div>
                      <div className="text-xs font-semibold text-neutral-200">{item.step}</div>
                      <div className="text-[11px] text-neutral-400 font-sans mt-0.5">{item.action}</div>
                    </div>
                    <div className="text-[10px] text-neutral-400 font-mono sm:text-right shrink-0">
                      {item.result}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-neutral-800 bg-[#141419] flex items-center justify-between text-[11px] font-mono text-neutral-500">
          <span className="hidden sm:inline">LangGraph Cyclic State Machine • Zero-Trust Guardrails • Qdrant HNSW</span>
          <span className="sm:hidden">Cognivault Architecture</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiWorkflowGraph;
