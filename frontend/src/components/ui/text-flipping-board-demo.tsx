"use client";
import { useState, useEffect } from "react";
import { TextFlippingBoard } from "@/components/ui/text-flipping-board";

interface Slide {
  text: string;
  durationMs: number;
}

const SLIDES: Slide[] = [
  {
    text: "Lumio was built with the desire to liberate creative teams from menial tasks, allowing them to focus on true strategic innovation.",
    durationMs: 7000,
  },
  {
    text: "BRING EVERY TEAM \nINTO SHARP FOCUS \n- LUMIO OS",
    durationMs: 6000,
  },
  {
    text: "CENTRALIZED KNOWLEDGE \nCONTEXTUAL AI \nTRUE INNOVATION",
    durationMs: 6000,
  },
];

export default function TextFlippingBoardDemo() {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const currentDuration = SLIDES[msgIdx].durationMs;
    const timer = setTimeout(() => {
      setMsgIdx((prev) => (prev + 1) % SLIDES.length);
    }, currentDuration);
    return () => clearTimeout(timer);
  }, [msgIdx]);

  return (
    <div className="flex w-full flex-col items-center justify-center gap-5 py-4">
      {/* Board Container */}
      <div className="relative w-full max-w-5xl">
        <TextFlippingBoard text={SLIDES[msgIdx].text} />
      </div>

      {/* Pagination Dots Only */}
      <div className="flex items-center gap-2 mt-2">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setMsgIdx(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
              msgIdx === idx ? "w-6 bg-black" : "w-2 bg-line hover:bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
