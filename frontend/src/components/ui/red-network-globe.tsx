import React from 'react';
import { LottieLight } from 'lottie-react';

interface RedNetworkGlobeProps {
  className?: string;
  size?: number | string;
  glow?: boolean;
}

export const RedNetworkGlobe: React.FC<RedNetworkGlobeProps> = ({
  className = '',
  size = 420,
  glow = false,
}) => {
  const sizeStyle =
    typeof size === 'number'
      ? { width: `${size}px`, height: `${size}px` }
      : { width: size, height: size };

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={sizeStyle}
    >
      {glow && (
        <div className="absolute inset-0 rounded-full bg-radial from-red-600/25 via-red-600/10 to-transparent blur-3xl pointer-events-none -z-10" />
      )}
      <LottieLight
        src="/red-network-globe.json"
        loop={true}
        autoplay={true}
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default RedNetworkGlobe;
