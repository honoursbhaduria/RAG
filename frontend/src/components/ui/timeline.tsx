"use client";
import {
  useScroll,
  useTransform,
  motion,
} from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

export interface TimelineEntry {
  title: string;
  content: ReactNode;
}

export interface TimelineProps {
  data: TimelineEntry[];
  title?: string;
  description?: string;
  className?: string;
}

export const Timeline = ({
  data,
  title = "Changelog from my journey",
  description,
  className = "",
}: TimelineProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    const updateHeight = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        setHeight(rect.height);
      }
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const lineHeight = Math.max(0, height - 100);
  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, lineHeight]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div
      className={`w-full bg-[#121212] text-white font-sans px-3 sm:px-6 md:px-10 transition-colors overflow-hidden rounded-[24px] sm:rounded-[32px] md:rounded-[48px] border border-white/5 ${className}`}
      ref={containerRef}
    >
      <div className="max-w-7xl mx-auto py-10 sm:py-16 md:py-20 px-1 sm:px-4 md:px-8 lg:px-10">
        <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-semibold mb-3 sm:mb-4 text-white max-w-4xl tracking-tight leading-tight">
          {title}
        </h2>
        {description ? (
          <p className="text-neutral-400 text-xs sm:text-sm md:text-base max-w-md font-body-lg">
            {description}
          </p>
        ) : null}
      </div>

      <div ref={ref} className="relative max-w-7xl mx-auto pb-12 sm:pb-16 md:pb-20">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex flex-col md:flex-row justify-between items-start pt-8 sm:pt-14 md:pt-28 md:gap-12 lg:gap-20"
          >
            {/* Left sticky milestone column */}
            <div className="sticky flex items-center top-20 sm:top-28 md:top-40 self-start z-30 md:w-[320px] lg:w-[380px] shrink-0">
              <div className="h-7 w-7 sm:h-9 sm:w-9 md:h-10 md:w-10 absolute left-1 sm:left-2 md:left-3 rounded-full bg-[#121212] border border-neutral-700 flex items-center justify-center shadow-xs">
                <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 rounded-full bg-white" />
              </div>
              <div className="hidden md:block pl-20 pr-4">
                <span className="font-label text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-2">
                  0{index + 1}
                </span>
                <h3 className="text-2xl lg:text-3xl font-bold font-display text-white leading-tight">
                  {item.title}
                </h3>
              </div>
            </div>

            {/* Right content column */}
            <div className="relative pl-10 sm:pl-14 md:pl-0 w-full flex-1 max-w-2xl ml-auto min-w-0">
              <div className="md:hidden block mb-3 sm:mb-4">
                <span className="font-label text-[11px] sm:text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-1">
                  0{index + 1}
                </span>
                <h3 className="text-lg sm:text-2xl font-bold font-display text-white mb-2 leading-snug">
                  {item.title}
                </h3>
              </div>
              {item.content}
            </div>
          </div>
        ))}
        <div
          style={{
            height: lineHeight + "px",
          }}
          className="absolute left-[14px] sm:left-[19px] md:left-8 top-10 overflow-hidden w-[2px] bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-neutral-800 to-transparent to-[99%] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]"
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className="absolute inset-x-0 top-0 w-[2px] bg-gradient-to-t from-purple-500 via-blue-500 to-transparent from-[0%] via-[10%] rounded-full"
          />
        </div>
      </div>
    </div>
  );
};

export default Timeline;
