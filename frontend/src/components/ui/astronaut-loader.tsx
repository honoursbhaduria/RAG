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
