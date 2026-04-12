'use client';

interface TopLoadingBarProps {
  isVisible: boolean;
}

export default function TopLoadingBar({ isVisible }: TopLoadingBarProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        zIndex: 9999,
        pointerEvents: 'none',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
    >
      {/* Base amber track */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(245, 158, 11, 0.25)',
        }}
      />

      {/* Animated progress fill */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, #f59e0b, #fbbf24, #fcd34d)',
          transformOrigin: 'left center',
          animation: isVisible ? 'loadingBarProgress 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite' : 'none',
        }}
      />

      {/* Shimmer highlight */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: isVisible ? 'loadingBarShimmer 1.4s linear infinite' : 'none',
        }}
      />

      {/* Glow effect */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          boxShadow: '0 0 8px 1px rgba(251, 191, 36, 0.7)',
          animation: isVisible ? 'loadingBarGlow 1.4s ease-in-out infinite alternate' : 'none',
        }}
      />

      <style>{`
        @keyframes loadingBarProgress {
          0%   { transform: scaleX(0.05); opacity: 1; }
          60%  { transform: scaleX(0.85); opacity: 1; }
          90%  { transform: scaleX(0.95); opacity: 1; }
          100% { transform: scaleX(1);    opacity: 0.8; }
        }

        @keyframes loadingBarShimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }

        @keyframes loadingBarGlow {
          0%   { opacity: 0.6; }
          100% { opacity: 1;   }
        }
      `}</style>
    </div>
  );
}
