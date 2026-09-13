import { useState } from 'react';
import TextFlippingBoardDemo from '@/components/text-flipping-board-demo';
import KeyboardDemo from '@/components/keyboard-demo';
import BrandTimeline from '@/components/brand-timeline';
import RippleGrid from '@/components/ui/RippleGrid';
import LogoLoop, { type LogoItem } from '@/components/ui/LogoLoop';
import RedNetworkGlobe from '@/components/ui/red-network-globe';
import RagFlowchartSection from '@/components/ui/rag-flowchart-section';
import DraggableCardDemo from '@/components/ui/draggable-card-demo-2';
import GooeyNav from '@/components/ui/GooeyNav';
import {
  IconCpu,
  IconDatabase,
  IconShieldCheck,
  IconBrain,
  IconSparkles,
  IconBolt,
  IconServer,
  IconActivity,
  IconChartBar,
  IconBrandOpenai,
} from '@tabler/icons-react';
import {
  Navbar,
  NavBody,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from '@/components/ui/resizable-navbar';

export default function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Pipeline", link: "#pipeline" },
    { name: "Architecture", link: "#architecture" },
    { name: "Subsystems", link: "#subsystems" },
  ];

  const partnerLogos: LogoItem[] = [
    {
      node: (
        <div className="flex items-center gap-3 text-neutral-600 hover:text-black transition-colors duration-200 select-none cursor-pointer">
          <IconBrain className="w-6 h-6 stroke-[1.75]" />
          <span className="font-h3 text-2xl md:text-3xl font-semibold tracking-tight">LangGraph</span>
        </div>
      ),
      title: "LangGraph",
    },
    {
      node: (
        <div className="flex items-center gap-3 text-neutral-600 hover:text-black transition-colors duration-200 select-none cursor-pointer">
          <IconShieldCheck className="w-6 h-6 stroke-[1.75]" />
          <span className="font-h3 text-2xl md:text-3xl font-semibold tracking-tight">NVIDIA NeMo</span>
        </div>
      ),
      title: "NVIDIA NeMo",
    },
    {
      node: (
        <div className="flex items-center gap-3 text-neutral-600 hover:text-black transition-colors duration-200 select-none cursor-pointer">
          <IconDatabase className="w-6 h-6 stroke-[1.75]" />
          <span className="font-h3 text-2xl md:text-3xl font-semibold tracking-tight">Qdrant</span>
        </div>
      ),
      title: "Qdrant",
    },
    {
      node: (
        <div className="flex items-center gap-3 text-neutral-600 hover:text-black transition-colors duration-200 select-none cursor-pointer">
          <IconCpu className="w-6 h-6 stroke-[1.75]" />
          <span className="font-h3 text-2xl md:text-3xl font-semibold tracking-tight">Groq LPUs</span>
        </div>
      ),
      title: "Groq LPUs",
    },
    {
      node: (
        <div className="flex items-center gap-3 text-neutral-600 hover:text-black transition-colors duration-200 select-none cursor-pointer">
          <IconSparkles className="w-6 h-6 stroke-[1.75]" />
          <span className="font-h3 text-2xl md:text-3xl font-semibold tracking-tight">Gemini 3072d</span>
        </div>
      ),
      title: "Gemini 3072d",
    },
    {
      node: (
        <div className="flex items-center gap-3 text-neutral-600 hover:text-black transition-colors duration-200 select-none cursor-pointer">
          <IconBolt className="w-6 h-6 stroke-[1.75]" />
          <span className="font-h3 text-2xl md:text-3xl font-semibold tracking-tight">FlashRank</span>
        </div>
      ),
      title: "FlashRank",
    },
    {
      node: (
        <div className="flex items-center gap-3 text-neutral-600 hover:text-black transition-colors duration-200 select-none cursor-pointer">
          <IconBrandOpenai className="w-6 h-6 stroke-[1.75]" />
          <span className="font-h3 text-2xl md:text-3xl font-semibold tracking-tight">Portkey AI</span>
        </div>
      ),
      title: "Portkey AI",
    },
    {
      node: (
        <div className="flex items-center gap-3 text-neutral-600 hover:text-black transition-colors duration-200 select-none cursor-pointer">
          <IconActivity className="w-6 h-6 stroke-[1.75]" />
          <span className="font-h3 text-2xl md:text-3xl font-semibold tracking-tight">Logfire</span>
        </div>
      ),
      title: "Logfire",
    },
    {
      node: (
        <div className="flex items-center gap-3 text-neutral-600 hover:text-black transition-colors duration-200 select-none cursor-pointer">
          <IconChartBar className="w-6 h-6 stroke-[1.75]" />
          <span className="font-h3 text-2xl md:text-3xl font-semibold tracking-tight">LangSmith</span>
        </div>
      ),
      title: "LangSmith",
    },
    {
      node: (
        <div className="flex items-center gap-3 text-neutral-600 hover:text-black transition-colors duration-200 select-none cursor-pointer">
          <IconServer className="w-6 h-6 stroke-[1.75]" />
          <span className="font-h3 text-2xl md:text-3xl font-semibold tracking-tight">FastAPI</span>
        </div>
      ),
      title: "FastAPI",
    },
  ];

  return (
    <div className="text-text font-body-lg min-h-screen antialiased selection:bg-black selection:text-white bg-page-bg">
      {/* 1. Dynamic Resizable Navbar */}
      <Navbar>
        {/* Desktop Navigation */}
        <NavBody>
          <NavbarLogo logoText="AGENTIC RAG" />
          <GooeyNav
            items={[
              { label: "Architecture", href: "#architecture" },
              { label: "Subsystems", href: "#subsystems" },
              { label: "Telemetry", href: "#telemetry" },
            ]}
            particleCount={15}
            particleDistances={[90, 10]}
            particleR={100}
            initialActiveIndex={0}
            animationTime={600}
            timeVariance={300}
            colors={[1, 2, 3, 1, 2, 3, 1, 4]}
          />
          <div className="flex items-center gap-3 relative z-20 shrink-0">
            <NavbarButton variant="secondary" href="http://localhost:8000/api/docs">Swagger Docs</NavbarButton>
            <NavbarButton variant="primary" href="http://localhost:8000/health">Health Check</NavbarButton>
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo logoText="3AM DEVS" />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
              <a
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative py-2 px-3 rounded-lg text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <span className="block">{item.name}</span>
              </a>
            ))}
            <div className="flex w-full flex-col gap-3 pt-3 border-t border-neutral-800">
              <NavbarButton
                onClick={() => setIsMobileMenuOpen(false)}
                variant="secondary"
                className="w-full justify-center"
              >
                Login
              </NavbarButton>
              <NavbarButton
                onClick={() => setIsMobileMenuOpen(false)}
                variant="primary"
                className="w-full justify-center"
              >
                Book a demo
              </NavbarButton>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      <main>
        {/* 1. Hero */}
        <section className="min-h-[1000px] pt-[200px] md:pt-[240px] px-margin max-w-[1728px] mx-auto flex flex-col items-center text-center relative overflow-visible bg-page-bg">
          <div className="relative w-full max-w-5xl flex flex-col items-center justify-center">
            {/* Grid Design with Depth (No Ripples) */}
            <div className="absolute -inset-x-8 md:-inset-x-24 -top-16 md:-top-24 h-[440px] md:h-[520px] overflow-hidden rounded-3xl pointer-events-auto -z-0">
              <RippleGrid
                enableRainbow={false}
                gridColor="#8C8880"
                rippleIntensity={0.0}
                perspective={0.5}
                gridSize={12}
                gridThickness={15}
                fadeDistance={1.4}
                vignetteStrength={2.2}
                mouseInteraction={true}
                mouseInteractionRadius={1.2}
                opacity={0.4}
                glowIntensity={0}
              />
            </div>

            <h1 className="relative z-10 font-display text-4xl sm:text-6xl md:text-[80px] leading-[1.05] tracking-[-0.04em] text-balance max-w-5xl mb-8 text-text font-semibold pointer-events-none select-none">
              Enterprise Agentic RAG
            </h1>
          </div>
          {/* Interactive Keyboard */}
          <div className="w-full max-w-[1492px] flex items-center justify-center relative z-10 py-4 md:py-8">
            <KeyboardDemo />
          </div>
        </section>

        {/* 2. Trust Strip with LogoLoop */}
        <section className="py-12 md:py-16 px-4 md:px-margin border-t border-line/30 max-w-[1728px] mx-auto flex flex-col items-center bg-page-bg relative z-0 overflow-hidden">
          <p className="font-label text-xs uppercase tracking-[0.2em] text-muted mb-8 text-center font-medium">
            Engineered with production-grade AI infrastructure
          </p>
          <div className="w-full overflow-hidden">
            <LogoLoop
              logos={partnerLogos}
              speed={60}
              direction="left"
              logoHeight={36}
              gap={72}
              hoverSpeed={0}
              scaleOnHover
              fadeOut
              fadeOutColor="#FAF9F5"
              ariaLabel="Partner brand logos"
            />
          </div>
        </section>

        {/* 3. Flowchart Visual Architecture around Central Astronaut */}
        <section id="pipeline">
          <RagFlowchartSection />
        </section>

        {/* 4. Manifesto */}
        <section className="py-[120px] md:py-[200px] px-margin max-w-[1728px] mx-auto relative flex flex-col items-center text-center bg-page-bg overflow-hidden">
          <div className="absolute top-1/2 -translate-y-1/2 right-[-60px] md:right-[3%] lg:right-[6%] w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] md:w-[520px] md:h-[520px] opacity-80 pointer-events-none -z-0">
            <RedNetworkGlobe size="100%" glow={false} />
          </div>
          <h2 className="font-display text-2xl sm:text-4xl md:text-[46px] leading-[1.2] md:leading-[1.15] text-balance max-w-[1240px] font-semibold text-text relative z-10">
            Unlike basic flat-similarity RAG pipelines, our Enterprise Agentic RAG implements dynamic LangGraph reasoning, zero-trust NeMo guardrails, and two-stage cross-encoder reranking for deterministic, hallucination-free retrieval.
          </h2>
        </section>

        {/* 5. Architecture Timeline */}
        <section id="architecture" className="py-[40px] md:py-[80px] px-margin max-w-[1728px] mx-auto bg-page-bg">
          <BrandTimeline />
        </section>

        {/* 6. Core Subsystems */}
        <section id="subsystems" className="py-[100px] md:py-[160px] px-margin max-w-[1728px] mx-auto flex flex-col items-center bg-page-bg">
          <h2 className="font-display text-2xl md:text-h2 mb-4 font-semibold text-center text-text">
            Engineered for enterprise scale.
          </h2>
          <p className="font-body-md text-base md:text-lg text-muted text-center max-w-2xl mb-12 md:mb-16">
            Production-hardened components delivering high throughput, fault tolerance, and deterministic multi-turn conversations.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
            {/* Card 1 */}
            <div className="bg-panel-bg rounded-[32px] p-6 sm:p-8 flex flex-col justify-between group border border-line/30 hover:border-line/60 hover:shadow-2xl transition-all duration-300">
              <div>
                <h4 className="font-h3 text-xl sm:text-2xl font-semibold mb-2 text-text">Adaptive Planning & Memory</h4>
                <p className="font-body-md text-sm sm:text-base text-muted leading-relaxed mb-6">
                  LangGraph StateGraph dynamically classifies intents between pure conversational context, document summaries, and technical retrieval, backed by MemorySaver thread persistence.
                </p>
              </div>

              {/* IDE Code Window */}
              <div className="rounded-2xl bg-[#111111] border border-neutral-800/90 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#181818] border-b border-neutral-800/80">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]/90"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/90"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]/90"></span>
                    <span className="ml-2 font-mono text-xs text-neutral-400">planner.py</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase text-neutral-500 font-medium">python</span>
                </div>
                <pre className="p-4 font-mono text-[11px] sm:text-xs leading-relaxed text-neutral-300 overflow-x-auto">
                  <code>
                    <span className="text-[#c678dd]">async def</span> <span className="text-[#61afef]">planner_node</span>(state: AgentState):{'\n'}
                    {'    '}intent = <span className="text-[#c678dd]">await</span> classify_intent(state[<span className="text-[#98c379]">"current_query"</span>]){'\n'}
                    {'    '}<span className="text-[#c678dd]">if</span> intent == <span className="text-[#98c379]">"CONVERSATIONAL"</span>:{'\n'}
                    {'        '}<span className="text-[#c678dd]">return</span> &#123;<span className="text-[#98c379]">"route"</span>: <span className="text-[#98c379]">"responder"</span>&#125;{'\n'}
                    {'    '}<span className="text-[#c678dd]">return</span> &#123;<span className="text-[#98c379]">"plan"</span>: [<span className="text-[#98c379]">"qdrant"</span>, <span className="text-[#98c379]">"flashrank"</span>], <span className="text-[#98c379]">"route"</span>: <span className="text-[#98c379]">"retriever"</span>&#125;
                  </code>
                </pre>
                <div className="px-4 py-2.5 bg-[#161616] border-t border-neutral-800/60 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                  <span className="text-emerald-400">route_planner() &rarr; RETRIEVAL | CONV</span>
                  <span className="text-neutral-500">MemorySaver()</span>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-soft-card rounded-[32px] p-6 sm:p-8 flex flex-col justify-between group border border-line/30 hover:border-line/60 hover:shadow-2xl transition-all duration-300">
              <div>
                <h4 className="font-h3 text-xl sm:text-2xl font-semibold mb-2 text-text">Zero-Trust NeMo Guardrails</h4>
                <p className="font-body-md text-sm sm:text-base text-muted leading-relaxed mb-6">
                  Dual-tier safety shield: sub-millisecond regex scanning (&lt; 1ms) plus NVIDIA NeMo Guardrails Colang 1.0 dialog flows intercepting prompt injections and jailbreaks before LLM or vector search.
                </p>
              </div>

              {/* IDE Code Window */}
              <div className="rounded-2xl bg-[#111111] border border-neutral-800/90 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#181818] border-b border-neutral-800/80">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]/90"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/90"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]/90"></span>
                    <span className="ml-2 font-mono text-xs text-neutral-400">rails.py</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase text-neutral-500 font-medium">python</span>
                </div>
                <pre className="p-4 font-mono text-[11px] sm:text-xs leading-relaxed text-neutral-300 overflow-x-auto">
                  <code>
                    <span className="text-[#c678dd]">async def</span> <span className="text-[#61afef]">verify_safety</span>(query: str):{'\n'}
                    {'    '}<span className="text-[#5c6370]"># Tier 1: Sub-millisecond regex gate (&lt;1ms)</span>{'\n'}
                    {'    '}<span className="text-[#c678dd]">if</span> any(re.search(p, query) <span className="text-[#c678dd]">for</span> p <span className="text-[#c678dd]">in</span> PATTERNS):{'\n'}
                    {'        '}<span className="text-[#c678dd]">raise</span> SecurityException(<span className="text-[#98c379]">"Blocked exploit"</span>){'\n'}
                    {'    '}<span className="text-[#5c6370]"># Tier 2: NeMo Colang rails</span>{'\n'}
                    {'    '}<span className="text-[#c678dd]">return await</span> nemo_rails.generate_async(query)
                  </code>
                </pre>
                <div className="px-4 py-2.5 bg-[#161616] border-t border-neutral-800/60 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                  <span className="text-blue-400">Regex Gate: &lt; 1ms latency</span>
                  <span className="text-neutral-500">Colang 1.0 Flows</span>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white-card rounded-[32px] p-6 sm:p-8 flex flex-col justify-between group border border-line/30 hover:border-line/60 hover:shadow-2xl transition-all duration-300">
              <div>
                <h4 className="font-h3 text-xl sm:text-2xl font-semibold mb-2 text-text">Hybrid Named Vectors & FlashRank</h4>
                <p className="font-body-md text-sm sm:text-base text-muted leading-relaxed mb-6">
                  Single Qdrant collection with 3072-dim Gemini embeddings and sticky failover to local Sentence-Transformers 768-dim (all-mpnet-base-v2), followed by sub-100ms FlashRank CPU cross-encoder reranking.
                </p>
              </div>

              {/* IDE Code Window */}
              <div className="rounded-2xl bg-[#111111] border border-neutral-800/90 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#181818] border-b border-neutral-800/80">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]/90"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/90"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]/90"></span>
                    <span className="ml-2 font-mono text-xs text-neutral-400">retrieval.py</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase text-neutral-500 font-medium">python</span>
                </div>
                <pre className="p-4 font-mono text-[11px] sm:text-xs leading-relaxed text-neutral-300 overflow-x-auto">
                  <code>
                    <span className="text-[#c678dd]">async def</span> <span className="text-[#61afef]">search_enterprise</span>(query: str):{'\n'}
                    {'    '}gemini_v, local_v = <span className="text-[#c678dd]">await</span> embed_dual(query){'\n'}
                    {'    '}candidates = <span className="text-[#c678dd]">await</span> qdrant.query_points({'\n'}
                    {'        '}<span className="text-[#98c379]">"enterprise_rag"</span>, vectors=&#123;<span className="text-[#98c379]">"gemini"</span>: gemini_v&#125;{'\n'}
                    {'    '}){'\n'}
                    {'    '}<span className="text-[#c678dd]">return</span> flashrank.rerank(query, candidates, top_n=5)
                  </code>
                </pre>
                <div className="px-4 py-2.5 bg-[#161616] border-t border-neutral-800/60 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                  <span className="text-purple-400">Dual: 3072d + 768d failover</span>
                  <span className="text-neutral-500">ONNX TinyBERT (&lt;80ms)</span>
                </div>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-panel-bg rounded-[32px] p-6 sm:p-8 flex flex-col justify-between group border border-line/30 hover:border-line/60 hover:shadow-2xl transition-all duration-300">
              <div>
                <h4 className="font-h3 text-xl sm:text-2xl font-semibold mb-2 text-text">Local Ingestion & Code Copilot</h4>
                <p className="font-body-md text-sm sm:text-base text-muted leading-relaxed mb-6">
                  Zero cloud OCR lock-in: 3-tier on-device document extraction cascade (pypdf &rarr; pdfplumber &rarr; pypdfium2) alongside an AI Code Copilot (/code/assist) powered by Groq LPUs & Gemini.
                </p>
              </div>

              {/* IDE Code Window */}
              <div className="rounded-2xl bg-[#111111] border border-neutral-800/90 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#181818] border-b border-neutral-800/80">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]/90"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/90"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]/90"></span>
                    <span className="ml-2 font-mono text-xs text-neutral-400">loaders.py</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase text-neutral-500 font-medium">python</span>
                </div>
                <pre className="p-4 font-mono text-[11px] sm:text-xs leading-relaxed text-neutral-300 overflow-x-auto">
                  <code>
                    <span className="text-[#c678dd]">def</span> <span className="text-[#61afef]">extract_pdf_cascade</span>(file_path: str):{'\n'}
                    {'    '}text = pypdf_loader(file_path){'\n'}
                    {'    '}<span className="text-[#c678dd]">if</span> len(text) &lt; 100:{'\n'}
                    {'        '}text = pdfplumber_loader(file_path){'\n'}
                    {'    '}<span className="text-[#c678dd]">if not</span> text:{'\n'}
                    {'        '}text = pypdfium2_loader(file_path){'\n'}
                    {'    '}<span className="text-[#c678dd]">return</span> chunk_paragraphs(text, max_chars=1500)
                  </code>
                </pre>
                <div className="px-4 py-2.5 bg-[#161616] border-t border-neutral-800/60 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                  <span className="text-amber-400">pypdf &rarr; pdfplumber &rarr; pdfium2</span>
                  <span className="text-neutral-500">POST /code/assist</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Testimonial */}
        <section className="py-[100px] md:py-[160px] px-margin max-w-[1400px] mx-auto flex flex-col items-center text-center bg-page-bg">
          {/* Split-Flap Interactive Quote Board */}
          <div className="w-full max-w-5xl mb-12">
            <TextFlippingBoardDemo />
          </div>

          <div className="flex items-center gap-4 mt-4">
            <div className="w-14 h-14 rounded-full bg-line overflow-hidden border border-line/40 shadow-sm">
              <img
                alt="Honours Bhadauria, Full Stack Developer"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC1VIcb_dh48u8vUQuC7XZTgj7oB_3w3BskgDGqYgkBlYd2P672QeJNyH1IwFQaDx68BXSs_NFT0BRY0Qm8PyTYkQNcW_inCFD5lVmD9hnJRdcHbWVrKNRSYBgj2UegNx6F-Gqt4ji-jfUhSzOL0Kr8XslosIJfEpOMZ5EaFgBLAB0YZ_OzrUErFWwfLYRJ1UABvEUMpumJA3oayLtZ64tgEUE7W5LkZOJKQj7NyZIZjhSjHrzCF20-FxFA1DJGbNNuPwKeeTO3Kuck"
              />
            </div>
            <div className="text-left">
              <p className="font-label text-sm font-bold text-text">Honours Bhadauria</p>
              <p className="font-label text-xs text-muted">Full Stack Developer</p>
            </div>
          </div>
        </section>



        {/* 10. Draggable Cards */}
        <section className="w-full relative overflow-clip">
          <DraggableCardDemo />
        </section>
      </main>

      {/* 11. Dark Footer */}
      <footer className="bg-black text-page-bg font-body-md text-body-md w-full pt-12 md:pt-16 pb-4 px-margin flex flex-col items-center rounded-t-[32px] md:rounded-t-[40px] mt-section">
        <div className="max-w-[1728px] mx-auto w-full">
          {/* Subheader info bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between w-full pb-8 text-neutral-500 text-xs font-mono tracking-wider uppercase">
            <span>Engineering modern digital systems since 2024</span>
            <div className="flex items-center gap-4 mt-2 sm:mt-0">
              <span>© {new Date().getFullYear()} 3AM DEVS</span>
              <span>•</span>
              <span>All rights reserved</span>
            </div>
          </div>

          {/* Massive 3AM DEVS Wordmark in clean black shade */}
          <div className="w-full overflow-hidden flex justify-center items-center pt-4 sm:pt-6 pb-2 select-none border-t border-neutral-800">
            <svg
              viewBox="0 0 1200 240"
              className="w-full h-auto select-none pointer-events-auto transition-colors duration-500"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
            >
              <text
                x="50%"
                y="62%"
                dominantBaseline="middle"
                textAnchor="middle"
                textLength="1160"
                lengthAdjust="spacingAndGlyphs"
                fill="#262626"
                className="hover:fill-[#3a3a3a] transition-colors duration-300"
                style={{
                  fontFamily: "'Archivo Black', sans-serif",
                  fontSize: "190px",
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                }}
              >
                3AM DEVS
              </text>
            </svg>
            <h1 className="sr-only">3AM DEVS</h1>
          </div>
        </div>
      </footer>
    </div>
  );
}
