import React from 'react';
import { LottieLight } from 'lottie-react';

interface AstronautProps {
  className?: string;
  size?: number;
}

export const AstronautLoader: React.FC<AstronautProps> = ({ className = '', size = 280 }) => {
  return (
    <div
      className={`relative flex items-center justify-center select-none animate-float-smooth ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <LottieLight
        src="/astronaut-3d.json"
        loop={true}
        autoplay={true}
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default AstronautLoader;
