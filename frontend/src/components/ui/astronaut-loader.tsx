import { LottieLight } from 'lottie-react';

interface AstronautProps {
  className?: string;
  size?: number;
}

const Loader = ({ className = '', size = 340 }: AstronautProps) => {
  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      {/* Ambient background glow */}
      <div className="absolute inset-4 rounded-full bg-radial from-neutral-300/30 via-neutral-200/10 to-transparent blur-2xl pointer-events-none -z-10" />

      <LottieLight
        src="/astronaut-3d.json"
        loop={true}
        autoplay={true}
        className="w-full h-full object-contain filter drop-shadow-[0_20px_35px_rgba(0,0,0,0.15)]"
      />
    </div>
  );
};

export default Loader;
