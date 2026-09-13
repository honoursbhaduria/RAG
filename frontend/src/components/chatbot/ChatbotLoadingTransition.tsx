import React, { useState, useEffect } from 'react';
import AstronautLoader from '@/components/ui/astronaut-loader';
import TextWaveLoader from '@/components/ui/text-wave-loader';

interface ChatbotLoadingTransitionProps {
  onComplete: () => void;
  durationMs?: number;
}

export const ChatbotLoadingTransition: React.FC<ChatbotLoadingTransitionProps> = ({
  onComplete,
  durationMs = 3800,
}) => {
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFinishing(true);
      setTimeout(() => {
        onComplete();
      }, 400);
    }, durationMs);

    return () => clearTimeout(timer);
  }, [durationMs, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-neutral-100 overflow-hidden select-none transition-all duration-400 ease-in-out ${
        isFinishing ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'
      }`}
    >
      {/* Deep pure black canvas without any blue/purple tint */}

      {/* Subtle Monochrome Tech Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Minimalist Center Assembly: Isolated Floating 3D Astronaut + Wavy Text Loader */}
      <div className="relative z-10 flex flex-col items-center justify-center animate-fade-in space-y-4">
        {/* Floating 3D Lottie Astronaut - Clean, no vector silhouette or rings */}
        <div className="relative flex items-center justify-center">
          <AstronautLoader size={280} />
        </div>

        {/* Custom Styled-Components Wavy "LOADING" Animation Below Astronaut */}
        <div className="flex items-center justify-center">
          <TextWaveLoader />
        </div>
      </div>
    </div>
  );
};

export default ChatbotLoadingTransition;
