import React from 'react';
import Loader from './astronaut-loader';

interface FlowStep {
  step: string;
  stepNum: number;
  title: string;
  subtitle: string;
  metric: string;
  image: string;
  alt: string;
  pos: {
    desktop: React.CSSProperties;
  };
}

const FLOW_STEPS: FlowStep[] = [
  {
    step: 'STEP 01',
    stepNum: 1,
    title: 'Document Ingestion',
    subtitle: 'Multi-Format Cascade & OCR',
    metric: 'Lossless Text Extraction',
    image: '/images/flowchart/step1-ingestion.jpg',
    alt: 'Automated document ingestion and OCR pipeline dashboard',
    pos: {
      desktop: { left: '3.5%', top: '30px', width: '310px' },
    },
  },
  {
    step: 'STEP 02',
    stepNum: 2,
    title: 'Semantic Chunking',
    subtitle: 'Syntax Tree Tokenization',
    metric: 'Context-Preserved Spans',
    image: '/images/flowchart/step2-chunking.jpg',
    alt: 'Semantic chunking and syntax tree tokenization analytics',
    pos: {
      desktop: { left: '37%', top: '15px', width: '300px' },
    },
  },
  {
    step: 'STEP 03',
    stepNum: 3,
    title: 'Dense Embeddings',
    subtitle: 'High-Dim Latent Vectors',
    metric: '3072-dim Vector Space',
    image: '/images/flowchart/step3-embedding.jpg',
    alt: '3072-dimensional dense embedding latent space projection',
    pos: {
      desktop: { right: '3.5%', top: '30px', width: '310px' },
    },
  },
  {
    step: 'STEP 04',
    stepNum: 4,
    title: 'Vector Indexing',
    subtitle: 'HNSW Graph Partitioning',
    metric: 'Sub-5ms Graph Traversal',
    image: '/images/flowchart/step4-indexing.jpg',
    alt: 'Hierarchical Navigable Small World HNSW graph indexing structure',
    pos: {
      desktop: { right: '3.5%', top: '420px', width: '310px' },
    },
  },
  {
    step: 'STEP 05',
    stepNum: 5,
    title: 'Security Gate',
    subtitle: 'Zero-Trust Safety Shield',
    metric: '< 1ms Gate Interception',
    image: '/images/flowchart/step5-security.jpg',
    alt: 'Enterprise AI Guardrails zero-trust security policy dashboard',
    pos: {
      desktop: { right: '4.5%', top: '820px', width: '320px' },
    },
  },
  {
    step: 'STEP 06',
    stepNum: 6,
    title: 'Hybrid Retrieval',
    subtitle: 'Dense & Sparse Fusion',
    metric: 'Top-25 Candidate Pool',
    image: '/images/flowchart/step6-retrieval.jpg',
    alt: 'Hybrid dense and sparse information retrieval scoring dashboard',
    pos: {
      desktop: { left: '37%', top: '940px', width: '300px' },
    },
  },
  {
    step: 'STEP 07',
    stepNum: 7,
    title: 'Cross-Rerank',
    subtitle: 'Cross-Attention Scoring',
    metric: 'Top-5 Precision Rerank',
    image: '/images/flowchart/step7-rerank.jpg',
    alt: 'Cross-attention query-document alignment scoring matrix',
    pos: {
      desktop: { left: '3.5%', top: '820px', width: '310px' },
    },
  },
  {
    step: 'STEP 08',
    stepNum: 8,
    title: 'LLM Synthesis',
    subtitle: 'Grounded Generation',
    metric: 'Deterministic & Cited',
    image: '/images/flowchart/step8-synthesis.jpg',
    alt: 'Grounded generative AI response synthesis with source citations',
    pos: {
      desktop: { left: '3.5%', top: '420px', width: '310px' },
    },
  },
];

export const RagFlowchartSection: React.FC = () => {

  return (
    <div className="w-full relative bg-page-bg">
      {/* Desktop Visual Flowchart (1320px high canvas) */}
      <section className="hidden xl:block h-[1320px] w-full max-w-[1728px] mx-auto relative overflow-hidden select-none">
        {/* SVG Flowchart Connectors (Crisp, No Glow) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
          viewBox="0 0 1600 1320"
          fill="none"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Clean, crisp technical arrowhead (no glow) */}
            <marker id="cleanArrowHead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M 0 0 L 6 3 L 0 6 Z" fill="#71717a" />
            </marker>
          </defs>

          {/* Clean Flow Paths (Crisp neutral lines, no glow) */}
          {/* Path 1 -> 2 */}
          <path
            d="M 360 140 C 460 120, 500 120, 590 120"
            stroke="#71717a"
            strokeWidth="1.75"
            strokeDasharray="6 5"
            markerEnd="url(#cleanArrowHead)"
          />
          <circle r="3" fill="#a1a1aa">
            <animateMotion dur="3.5s" repeatCount="indefinite" path="M 360 140 C 460 120, 500 120, 590 120" />
          </circle>

          {/* Path 2 -> 3 */}
          <path
            d="M 890 120 C 1000 120, 1120 130, 1225 140"
            stroke="#71717a"
            strokeWidth="1.75"
            strokeDasharray="6 5"
            markerEnd="url(#cleanArrowHead)"
          />
          <circle r="3" fill="#a1a1aa">
            <animateMotion dur="3.5s" repeatCount="indefinite" path="M 890 120 C 1000 120, 1120 130, 1225 140" />
          </circle>

          {/* Path 3 -> 4 */}
          <path
            d="M 1380 320 C 1430 350, 1430 400, 1380 440"
            stroke="#71717a"
            strokeWidth="1.75"
            strokeDasharray="6 5"
            markerEnd="url(#cleanArrowHead)"
          />
          <circle r="3" fill="#a1a1aa">
            <animateMotion dur="3s" repeatCount="indefinite" path="M 1380 320 C 1430 350, 1430 400, 1380 440" />
          </circle>

          {/* Path 4 -> 5 */}
          <path
            d="M 1380 710 C 1430 750, 1430 790, 1390 840"
            stroke="#71717a"
            strokeWidth="1.75"
            strokeDasharray="6 5"
            markerEnd="url(#cleanArrowHead)"
          />
          <circle r="3" fill="#a1a1aa">
            <animateMotion dur="3s" repeatCount="indefinite" path="M 1380 710 C 1430 750, 1430 790, 1390 840" />
          </circle>

          {/* Path 5 -> 6 */}
          <path
            d="M 1210 960 C 1110 1010, 1020 1060, 890 1060"
            stroke="#71717a"
            strokeWidth="1.75"
            strokeDasharray="6 5"
            markerEnd="url(#cleanArrowHead)"
          />
          <circle r="3" fill="#a1a1aa">
            <animateMotion dur="3.5s" repeatCount="indefinite" path="M 1210 960 C 1110 1010, 1020 1060, 890 1060" />
          </circle>

          {/* Path 6 -> 7 */}
          <path
            d="M 590 1060 C 490 1060, 440 1010, 360 960"
            stroke="#71717a"
            strokeWidth="1.75"
            strokeDasharray="6 5"
            markerEnd="url(#cleanArrowHead)"
          />
          <circle r="3" fill="#a1a1aa">
            <animateMotion dur="3.5s" repeatCount="indefinite" path="M 590 1060 C 490 1060, 440 1010, 360 960" />
          </circle>

          {/* Path 7 -> 8 */}
          <path
            d="M 210 840 C 170 790, 170 730, 210 690"
            stroke="#71717a"
            strokeWidth="1.75"
            strokeDasharray="6 5"
            markerEnd="url(#cleanArrowHead)"
          />
          <circle r="3" fill="#a1a1aa">
            <animateMotion dur="3s" repeatCount="indefinite" path="M 210 840 C 170 790, 170 730, 210 690" />
          </circle>

          {/* Path 8 -> 1 (Agent Cycle) */}
          <path
            d="M 210 440 C 170 380, 170 320, 210 260"
            stroke="#71717a"
            strokeWidth="1.75"
            strokeDasharray="6 5"
            markerEnd="url(#cleanArrowHead)"
          />
          <circle r="3" fill="#a1a1aa">
            <animateMotion dur="3s" repeatCount="indefinite" path="M 210 440 C 170 380, 170 320, 210 260" />
          </circle>

          {/* Central Neutral Conduits to Astronaut */}
          <path
            d="M 360 550 C 490 550, 600 550, 660 550"
            stroke="#52525b"
            strokeWidth="1.2"
            strokeDasharray="4 6"
            strokeOpacity="0.4"
          />
          <path
            d="M 1240 550 C 1110 550, 1000 550, 940 550"
            stroke="#52525b"
            strokeWidth="1.2"
            strokeDasharray="4 6"
            strokeOpacity="0.4"
          />
        </svg>

        {/* Central Anchor - 3D Astronaut (Clean, No Glow, No Concentric Circles) */}
        <div
          className="absolute z-20 select-none flex flex-col items-center justify-center pointer-events-none"
          style={{ left: '50%', top: '550px', transform: 'translate(-50%, -50%)' }}
        >
          <Loader size={340} />
        </div>

        {/* 8 Gray Framed Flowchart Cards Surrounding the Astronaut (Static, No Hover Effects) */}
        {FLOW_STEPS.map((step) => (
          <div
            key={step.stepNum}
            className="absolute z-10"
            style={step.pos.desktop}
          >
            {/* Gray Matte Gallery Chassis Frame (No Hover) */}
            <div className="relative rounded-[20px] p-3.5 bg-[#252528] border border-neutral-600/50 shadow-md">
              {/* Corner registration marks */}
              <div className="absolute top-2 left-2 w-1.5 h-1.5 border-t border-l border-neutral-500/50 pointer-events-none" />
              <div className="absolute top-2 right-2 w-1.5 h-1.5 border-t border-r border-neutral-500/50 pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-1.5 h-1.5 border-b border-l border-neutral-500/50 pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-1.5 h-1.5 border-b border-r border-neutral-500/50 pointer-events-none" />

              {/* Frame Header Bar */}
              <div className="flex items-center justify-between px-1 pb-2 border-b border-neutral-600/40 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-neutral-400" />
                  <span className="font-mono text-[11px] font-semibold tracking-wider text-neutral-300">
                    {step.step}
                  </span>
                </div>
              </div>

              {/* Framed Image Canvas */}
              <div className="relative h-[160px] w-full rounded-[12px] overflow-hidden border border-neutral-700/60 bg-[#1b1b1d]">
                <img
                  src={step.image}
                  alt={step.alt}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Subtle vignette shadow overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 pointer-events-none" />
              </div>

              {/* Frame Footer Info */}
              <div className="pt-2.5 px-1">
                <h4 className="font-sans text-sm font-semibold text-neutral-200">
                  {step.title}
                </h4>
                <p className="font-mono text-[11px] text-neutral-400 mt-0.5">
                  {step.subtitle}
                </p>
                <div className="mt-2 pt-1.5 border-t border-neutral-600/40 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                  <span>{step.metric}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Mobile/Tablet Responsive Flowchart View (Overlapping Cards Deck Effect) */}
      <section className="block xl:hidden py-12 px-3 sm:px-6 max-w-lg mx-auto select-none">
        {/* Mobile Central Anchor */}
        <div className="flex flex-col items-center justify-center mb-8">
          <Loader size={240} />
        </div>

        {/* Overlapping Stacking Cards View */}
        <div className="relative w-full pb-16">
          {FLOW_STEPS.map((step, index) => (
            <div
              key={step.stepNum}
              className="sticky transition-all duration-200"
              style={{
                top: `${72 + index * 10}px`,
                zIndex: index + 10,
                marginTop: index === 0 ? 0 : '-16px',
                marginBottom: index === FLOW_STEPS.length - 1 ? '0' : '24px',
              }}
            >
              {/* Overlapping Card Chassis with Top/Bottom Elevation Shadow */}
              <div className="relative rounded-[22px] p-3.5 sm:p-4 bg-[#232326] border border-neutral-600/70 shadow-[0_-8px_24px_rgba(0,0,0,0.55),0_16px_32px_rgba(0,0,0,0.6)] backdrop-blur-md">
                {/* Corner registration marks */}
                <div className="absolute top-2.5 left-2.5 w-1.5 h-1.5 border-t border-l border-neutral-500/60 pointer-events-none" />
                <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 border-t border-r border-neutral-500/60 pointer-events-none" />
                <div className="absolute bottom-2.5 left-2.5 w-1.5 h-1.5 border-b border-l border-neutral-500/60 pointer-events-none" />
                <div className="absolute bottom-2.5 right-2.5 w-1.5 h-1.5 border-b border-r border-neutral-500/60 pointer-events-none" />

                {/* Card Header Bar */}
                <div className="flex items-center justify-between px-1 pb-2 border-b border-neutral-700/60 mb-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                    <span className="font-mono text-xs font-semibold tracking-wider text-neutral-200 truncate">
                      {step.step} &bull; {step.title}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] font-semibold tracking-widest text-neutral-400 bg-neutral-800/80 px-2 py-0.5 rounded-full border border-neutral-700 shrink-0 ml-2">
                    STAGE 0{step.stepNum}
                  </span>
                </div>

                {/* Card Image */}
                <div className="relative h-[145px] sm:h-[175px] w-full rounded-[14px] overflow-hidden border border-neutral-700/80 mb-2.5 bg-[#18181a]">
                  <img
                    src={step.image}
                    alt={step.alt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 pointer-events-none" />
                </div>

                {/* Card Footer Info */}
                <div className="flex items-center justify-between text-xs font-mono text-neutral-400 px-1 gap-2">
                  <span className="text-neutral-300 font-sans font-medium text-[11px] sm:text-xs truncate">
                    {step.subtitle}
                  </span>
                  <span className="text-emerald-400/90 font-mono text-[10px] sm:text-[11px] bg-emerald-950/40 border border-emerald-800/50 px-2 py-0.5 rounded-md shrink-0 whitespace-nowrap">
                    {step.metric}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default RagFlowchartSection;
