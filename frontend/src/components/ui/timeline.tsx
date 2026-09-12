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
      className={`w-full bg-[#121212] text-white font-sans md:px-10 transition-colors overflow-hidden rounded-[32px] md:rounded-[48px] border border-white/5 ${className}`}
      ref={containerRef}
    >
      <div className="max-w-7xl mx-auto py-20 px-4 md:px-8 lg:px-10">
        <h2 className="text-2xl md:text-4xl lg:text-5xl font-display font-semibold mb-4 text-white max-w-4xl tracking-tight">
          {title}
        </h2>
        {description ? (
          <p className="text-neutral-400 text-sm md:text-base max-w-md font-body-lg">
            {description}
          </p>
        ) : null}
      </div>

      <div ref={ref} className="relative max-w-7xl mx-auto pb-20">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex flex-col md:flex-row justify-between items-start pt-12 md:pt-28 md:gap-12 lg:gap-20"
          >
            {/* Left sticky milestone column */}
            <div className="sticky flex items-center top-28 md:top-40 self-start z-30 md:w-[320px] lg:w-[380px] shrink-0">
              <div className="h-10 absolute left-3 md:left-3 w-10 rounded-full bg-[#121212] border border-neutral-700 flex items-center justify-center shadow-xs">
                <div className="h-3.5 w-3.5 rounded-full bg-white" />
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
            <div className="relative pl-16 md:pl-0 w-full flex-1 max-w-2xl ml-auto">
              <div className="md:hidden block mb-4">
                <span className="font-label text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-1">
                  0{index + 1}
                </span>
                <h3 className="text-2xl font-bold font-display text-white mb-2">
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
          className="absolute md:left-8 left-8 top-10 overflow-hidden w-[2px] bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-neutral-800 to-transparent to-[99%] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]"
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
