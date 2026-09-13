"use client";
import { cn } from "@/lib/utils";
import React, { useRef, useState, useEffect } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";

export const DraggableContainerContext = React.createContext<React.RefObject<HTMLDivElement | null>>({
  current: null,
});

export const DraggableCardBody = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  const containerRef = React.useContext(DraggableContainerContext);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [constraints, setConstraints] = useState({
    top: -250,
    left: -450,
    right: 450,
    bottom: 250,
  });

  const springConfig = {
    stiffness: 140,
    damping: 20,
    mass: 0.5,
  };

  const rotateX = useSpring(
    useTransform(mouseY, [-200, 200], [5, -5]),
    springConfig
  );
  const rotateY = useSpring(
    useTransform(mouseX, [-200, 200], [-5, 5]),
    springConfig
  );

  useEffect(() => {
    const updateConstraints = () => {
      if (containerRef?.current && cardRef.current) {
        const cRect = containerRef.current.getBoundingClientRect();
        const kRect = cardRef.current.getBoundingClientRect();
        setConstraints({
          top: -(kRect.top - cRect.top) + 20,
          left: -(kRect.left - cRect.left) + 20,
          right: cRect.width - (kRect.left - cRect.left + kRect.width) - 20,
          bottom: cRect.height - (kRect.top - cRect.top + kRect.height) - 20,
        });
      }
    };

    updateConstraints();
    window.addEventListener("resize", updateConstraints);
    return () => window.removeEventListener("resize", updateConstraints);
  }, [containerRef]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const { width, height, left, top } = cardRef.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      drag
      dragConstraints={constraints}
      dragElastic={0.08}
      dragMomentum={true}
      onDragStart={() => {
        setIsDragging(true);
        document.body.style.cursor = "grabbing";
      }}
      onDragEnd={() => {
        setIsDragging(false);
        document.body.style.cursor = "default";
        mouseX.set(0);
        mouseY.set(0);
      }}
      style={{
        rotateX,
        rotateY,
        zIndex: isDragging ? 60 : 10,
        willChange: "transform",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative min-h-[340px] w-72 sm:w-80 overflow-hidden rounded-2xl border border-neutral-300/80 dark:border-neutral-700/80 bg-white/95 p-5 shadow-xl dark:bg-[#1c1c1f]/95 cursor-grab active:cursor-grabbing transition-shadow",
        isDragging && "shadow-2xl scale-[1.03]",
        className
      )}
    >
      {children}
    </motion.div>
  );
};

export const DraggableCardContainer = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <DraggableContainerContext.Provider value={containerRef}>
      <div
        ref={containerRef}
        className={cn("[perspective:2500px]", className)}
      >
        {children}
      </div>
    </DraggableContainerContext.Provider>
  );
};
