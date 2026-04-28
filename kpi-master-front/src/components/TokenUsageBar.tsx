'use client';

import { useEffect, useState, useCallback } from 'react';

function formatTokenCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export default function TokenUsageBar() {
  const [tokensUsed, setTokensUsed] = useState(0);
  const [tokenLimit, setTokenLimit] = useState(1_000_000);
  const [isHovered, setIsHovered] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  const loadFromStorage = useCallback(() => {
    const used = parseInt(localStorage.getItem('tokensUsed') || '0', 10);
    const limit = parseInt(localStorage.getItem('tokenLimit') || '1000000', 10);
    setTokensUsed(isNaN(used) ? 0 : used);
    setTokenLimit(isNaN(limit) || limit === 0 ? 1_000_000 : limit);
  }, []);

  useEffect(() => {
    loadFromStorage();
    setHasMounted(true);

    // Listen for storage events (dispatched from the chat page after analysis)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'tokensUsed' || e.key === 'tokenLimit') {
        loadFromStorage();
      }
    };

    // Listen for custom event (same-tab updates)
    const handleCustom = () => loadFromStorage();

    window.addEventListener('storage', handleStorage);
    window.addEventListener('tokenUsageUpdated', handleCustom);

    // Poll periodically as a safety net (every 30 seconds)
    const interval = setInterval(loadFromStorage, 30_000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('tokenUsageUpdated', handleCustom);
      clearInterval(interval);
    };
  }, [loadFromStorage]);

  if (!hasMounted) return null;

  const percentage = tokenLimit > 0 ? Math.min((tokensUsed / tokenLimit) * 100, 100) : 0;

  // Color gradient: amber at low usage, transitions to red at high usage
  const getBarColor = (pct: number) => {
    if (pct < 60) return 'from-amber-400 to-amber-500';
    if (pct < 85) return 'from-amber-500 to-orange-500';
    return 'from-orange-500 to-red-500';
  };

  const getGlowColor = (pct: number) => {
    if (pct < 60) return 'rgba(245, 158, 11, 0.3)';
    if (pct < 85) return 'rgba(249, 115, 22, 0.3)';
    return 'rgba(239, 68, 68, 0.3)';
  };

  return (
    <div
      className="fixed top-4 right-4 z-50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="relative overflow-hidden rounded-full border border-white/10 backdrop-blur-xl"
        style={{
          background: 'rgba(0, 0, 0, 0.45)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          boxShadow: isHovered
            ? `0 8px 32px ${getGlowColor(percentage)}, 0 0 0 1px rgba(255,255,255,0.08)`
            : '0 4px 16px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)',
        }}
      >
        {/* Inner container */}
        <div className="flex items-center gap-2.5 px-3.5 py-2">
          {/* Lightning icon */}
          <div
            className="flex items-center justify-center w-6 h-6 rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.05))',
              boxShadow: '0 0 8px rgba(245, 158, 11, 0.15)',
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-amber-400"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>

          {/* Progress section */}
          <div className="flex flex-col gap-1" style={{ minWidth: '120px' }}>
            {/* Label */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                Tokens
              </span>
              <span className="text-[10px] font-bold tabular-nums text-white/70">
                {formatTokenCount(tokensUsed)}{' '}
                <span className="text-white/30">/ {formatTokenCount(tokenLimit)}</span>
              </span>
            </div>

            {/* Progress bar track */}
            <div
              className="w-full h-1.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(255, 255, 255, 0.06)' }}
            >
              <div
                className={`h-full rounded-full bg-gradient-to-r ${getBarColor(percentage)}`}
                style={{
                  width: `${percentage}%`,
                  transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: `0 0 6px ${getGlowColor(percentage)}`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip on hover */}
      <div
        className="absolute right-0 mt-2 overflow-hidden rounded-xl border border-white/10 backdrop-blur-xl shadow-2xl"
        style={{
          background: 'rgba(0, 0, 0, 0.6)',
          opacity: isHovered ? 1 : 0,
          transform: isHovered ? 'translateY(0) scale(1)' : 'translateY(-4px) scale(0.95)',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: isHovered ? 'auto' : 'none',
          minWidth: '200px',
        }}
      >
        <div className="px-4 py-3 space-y-2">
          <div className="flex items-center gap-2">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-amber-400"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span className="text-xs font-semibold text-white/80">
              Consumo de Tokens
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-white/40">Consumido</span>
              <span className="text-white/70 font-mono font-semibold">
                {tokensUsed.toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-white/40">Limite</span>
              <span className="text-white/70 font-mono font-semibold">
                {tokenLimit.toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-white/40">Restante</span>
              <span className="text-emerald-400/80 font-mono font-semibold">
                {Math.max(0, tokenLimit - tokensUsed).toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
          <div
            className="w-full h-0.5 rounded-full"
            style={{ background: 'rgba(255, 255, 255, 0.06)' }}
          />
          <p className="text-[11px] text-white/30 leading-relaxed">
            {percentage < 85
              ? 'Seus tokens são consumidos a cada solicitação de análise.'
              : '⚠️ Você está próximo do limite de tokens.'}
          </p>
        </div>
      </div>

      {/* Inline animation */}
      <style jsx>{`
        @keyframes tkGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
          50% { box-shadow: 0 0 12px 2px rgba(245, 158, 11, 0.1); }
        }
      `}</style>
    </div>
  );
}
