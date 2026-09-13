import {
  DraggableCardBody,
  DraggableCardContainer,
} from "@/components/ui/draggable-card";

export default function DraggableCardDemo() {
  const items = [
    {
      step: "NODE 01",
      title: "StateGraph Reasoning Core",
      subtitle: "LangGraph Cyclic Planner",
      image: "/images/draggable/node1-stategraph.jpg",
      className: "absolute top-10 left-[4%] sm:left-[8%] rotate-[-4deg]",
    },
    {
      step: "NODE 02",
      title: "Semantic Knowledge Mesh",
      subtitle: "Qdrant Hybrid Vectors",
      image: "/images/draggable/node2-knowledge-mesh.jpg",
      className: "absolute top-12 right-[4%] sm:right-[8%] rotate-[5deg]",
    },
    {
      step: "NODE 03",
      title: "Agentic Code Studio",
      subtitle: "Groq LPU Copilot",
      image: "/images/draggable/node3-code-copilot.jpg",
      className: "absolute top-[280px] left-[10%] sm:left-[16%] rotate-[3deg]",
    },
    {
      step: "NODE 04",
      title: "Neural Vector Accelerator",
      subtitle: "FlashRank CPU ONNX",
      image: "/images/draggable/node4-tensor-accelerator.jpg",
      className: "absolute top-[290px] right-[10%] sm:right-[16%] rotate-[-5deg]",
    },
    {
      step: "NODE 05",
      title: "Zero-Trust Security Gate",
      subtitle: "NeMo Colang Shield",
      image: "/images/draggable/node5-guardrails-shield.jpg",
      className: "absolute bottom-10 left-[6%] sm:left-[12%] rotate-[-2deg]",
    },
    {
      step: "NODE 06",
      title: "Resilient Portkey Gateway",
      subtitle: "Sub-100ms LPU Inference",
      image: "/images/draggable/node6-api-gateway.jpg",
      className: "absolute bottom-10 right-[6%] sm:right-[12%] rotate-[4deg]",
    },
  ];

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8">
      {/* Movable Picture Box Container with Fine Art Rag Grain Finish */}
      <DraggableCardContainer className="relative flex h-[880px] md:h-[940px] w-full items-center justify-center overflow-hidden rounded-[32px] border border-neutral-300/70 dark:border-neutral-800 bg-[#f4f2ea] dark:bg-[#151518] shadow-[inset_0_2px_30px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_2px_40px_rgba(0,0,0,0.5)] select-none">
        {/* Fine Art Rag Paper / Tactile Grain Finish Overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-45 mix-blend-overlay z-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='ragGrain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23ragGrain)' opacity='0.75'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }}
        />

        {/* Subtle Vignette Depth */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.08)_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.45)_100%)] z-0" />

        {/* Header Status Indicator */}
        <div className="absolute top-6 left-8 z-20 flex items-center gap-2 select-none pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-neutral-500 dark:bg-neutral-400" />
          <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-600 dark:text-neutral-400 font-semibold">
            Interactive Architecture Canvas • Drag to Rearrange
          </span>
        </div>

        {/* Centerpiece Watermark */}
        <p className="absolute top-1/2 mx-auto max-w-xl -translate-y-1/2 text-center text-2xl sm:text-3xl md:text-5xl font-normal libre-caslon-display-regular italic text-neutral-400/80 dark:text-neutral-600 select-none pointer-events-none px-6 z-0">
          Deterministic, hallucination-free retrieval for the enterprise.
        </p>

        {/* Draggable Cards Distributed Across Canvas */}
        {items.map((item) => (
          <DraggableCardBody key={item.title} className={item.className}>
            {/* Card Header */}
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-neutral-200/80 dark:border-neutral-800">
              <span className="text-[10px] font-mono font-bold tracking-wider text-neutral-500 dark:text-neutral-400 uppercase">
                {item.step}
              </span>
              <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">
                Drag ✥
              </span>
            </div>

            {/* Picture Window */}
            <div className="relative overflow-hidden rounded-xl h-48 sm:h-52 w-full bg-black/10 dark:bg-black/40">
              <img
                src={item.image}
                alt={item.title}
                className="pointer-events-none w-full h-full object-cover border border-neutral-200/80 dark:border-neutral-800 shadow-sm"
                loading="lazy"
              />
              {/* Subtle card grain */}
              <div
                className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay z-20"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='cardGrain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23cardGrain)'/%3E%3C/svg%3E")`,
                }}
              />
            </div>

            {/* Card Footer */}
            <div className="mt-3">
              <h3 className="text-sm sm:text-base font-bold text-neutral-800 dark:text-neutral-100 select-none">
                {item.title}
              </h3>
              <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400 mt-0.5 select-none">
                {item.subtitle}
              </p>
            </div>
          </DraggableCardBody>
        ))}
      </DraggableCardContainer>
    </div>
  );
}
