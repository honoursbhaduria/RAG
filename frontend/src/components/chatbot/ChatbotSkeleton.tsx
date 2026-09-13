import React from 'react';

export const ChatbotSkeleton: React.FC = () => {
  return (
    <div className="flex h-screen w-full bg-[#0d0d11] text-neutral-200 overflow-hidden font-sans select-none">
      {/* 1. Left Sidebar Skeleton (Desktop) */}
      <aside className="hidden md:flex w-72 lg:w-80 flex-col border-r border-neutral-800/80 bg-[#111116] p-4 space-y-4 shrink-0">
        {/* Workspace Brand Shimmer */}
        <div className="flex items-center gap-3 pb-3 border-b border-neutral-800/80">
          <div className="w-8 h-8 rounded-xl bg-neutral-800 animate-shimmer" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3.5 w-28 rounded-md bg-neutral-800 animate-shimmer" />
            <div className="h-2.5 w-20 rounded-md bg-neutral-800/60 animate-shimmer" />
          </div>
        </div>

        {/* New Thread Button Skeleton */}
        <div className="h-9 w-full rounded-xl bg-neutral-800/70 border border-neutral-700/50 animate-shimmer" />

        {/* Document Ingestion Dropzone Skeleton */}
        <div className="p-3.5 rounded-xl border border-dashed border-neutral-700/60 bg-[#16161c] space-y-2 text-center">
          <div className="w-5 h-5 mx-auto rounded-md bg-neutral-800 animate-shimmer" />
          <div className="h-3 w-32 mx-auto rounded bg-neutral-800 animate-shimmer" />
          <div className="h-2 w-44 mx-auto rounded bg-neutral-800/60 animate-shimmer" />
        </div>

        {/* Persona Selector Skeleton */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-24 rounded bg-neutral-800 animate-shimmer" />
          </div>
          <div className="space-y-1.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-2.5 rounded-xl bg-neutral-800/40 border border-neutral-800 space-y-1.5"
              >
                <div className="h-3 w-32 rounded bg-neutral-700/60 animate-shimmer" />
                <div className="h-2 w-40 rounded bg-neutral-800/60 animate-shimmer" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Sessions Skeleton */}
        <div className="space-y-2 flex-1 pt-1">
          <div className="h-2.5 w-20 rounded bg-neutral-800 animate-shimmer" />
          <div className="space-y-1.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-8 rounded-lg bg-neutral-800/30 border border-neutral-800/60 animate-shimmer"
              />
            ))}
          </div>
        </div>

        {/* Telemetry Status Footer Skeleton */}
        <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between">
          <div className="h-3 w-28 rounded bg-neutral-800/70 animate-shimmer" />
          <div className="w-2 h-2 rounded-full bg-emerald-500/50 animate-ping" />
        </div>
      </aside>

      {/* 2. Main Chat Area Skeleton */}
      <main className="flex-1 flex flex-col h-full bg-[#0a0a0d] relative overflow-hidden">
        {/* Chat Top Header */}
        <header className="h-14 border-b border-neutral-800/80 bg-[#111116]/80 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-24 rounded-lg bg-neutral-800/80 animate-shimmer" />
            <div className="h-4 w-36 rounded-md bg-neutral-800/60 animate-shimmer" />
          </div>

          <div className="flex items-center gap-2">
            <div className="h-6 w-20 rounded-full bg-neutral-800/70 animate-shimmer" />
            <div className="h-6 w-28 rounded-full bg-neutral-800/70 animate-shimmer" />
          </div>
        </header>

        {/* Message Stream Skeleton */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-4xl w-full mx-auto">
          {/* Assistant Welcome Bubble */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-neutral-800 shrink-0 animate-shimmer" />
            <div className="space-y-2.5 flex-1 max-w-2xl bg-[#131318] p-4 rounded-2xl border border-neutral-800/70">
              <div className="h-3.5 w-48 rounded bg-neutral-700/60 animate-shimmer" />
              <div className="h-3 w-full rounded bg-neutral-800/80 animate-shimmer" />
              <div className="h-3 w-5/6 rounded bg-neutral-800/80 animate-shimmer" />
              <div className="h-3 w-3/4 rounded bg-neutral-800/80 animate-shimmer" />

              {/* Thought Process Accordion Skeleton */}
              <div className="mt-3 p-2.5 rounded-xl bg-[#181820] border border-neutral-800 space-y-1.5">
                <div className="h-2.5 w-32 rounded bg-neutral-700 animate-shimmer" />
                <div className="h-2 w-56 rounded bg-neutral-800/70 animate-shimmer" />
              </div>
            </div>
          </div>

          {/* User Query Bubble Skeleton */}
          <div className="flex justify-end">
            <div className="bg-neutral-800/90 border border-neutral-700/70 p-3.5 rounded-2xl rounded-tr-sm max-w-md w-full space-y-2">
              <div className="h-3 w-full rounded bg-neutral-700 animate-shimmer" />
              <div className="h-3 w-2/3 rounded bg-neutral-700/70 animate-shimmer" />
            </div>
          </div>

          {/* Assistant Technical Response with Code Block Skeleton */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-neutral-800 shrink-0 animate-shimmer" />
            <div className="space-y-3 flex-1 max-w-2xl bg-[#131318] p-4 rounded-2xl border border-neutral-800/70">
              <div className="h-3.5 w-40 rounded bg-neutral-700/60 animate-shimmer" />
              <div className="h-3 w-full rounded bg-neutral-800/80 animate-shimmer" />
              <div className="h-3 w-4/5 rounded bg-neutral-800/80 animate-shimmer" />

              {/* Code Snippet Box Skeleton */}
              <div className="rounded-xl border border-neutral-800 bg-[#0c0c10] p-3 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
                    <span className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
                    <span className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
                  </div>
                  <div className="h-2.5 w-16 rounded bg-neutral-800 animate-shimmer" />
                </div>
                <div className="h-2.5 w-full rounded bg-neutral-800/80 animate-shimmer" />
                <div className="h-2.5 w-3/4 rounded bg-neutral-800/80 animate-shimmer" />
                <div className="h-2.5 w-5/6 rounded bg-neutral-800/80 animate-shimmer" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Input Area Skeleton */}
        <div className="p-4 border-t border-neutral-800/80 bg-[#111116]/90 shrink-0">
          <div className="max-w-4xl mx-auto rounded-2xl border border-neutral-700/60 bg-[#15151c] p-3 space-y-3">
            <div className="h-10 w-full rounded-lg bg-neutral-800/40 animate-shimmer" />

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-neutral-800 animate-shimmer" />
                <div className="h-6 w-24 rounded-lg bg-neutral-800/70 animate-shimmer" />
              </div>

              <div className="w-9 h-9 rounded-xl bg-neutral-800 animate-shimmer" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChatbotSkeleton;
