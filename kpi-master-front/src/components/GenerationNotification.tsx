'use client';

import { useEffect, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

/**
 * A tiny popup that appears in the top-right corner when an in-progress
 * generation is interrupted (e.g. the user navigated away from the chat page).
 * Rendered at the layout level so it persists across page navigations.
 */
export default function GenerationNotification() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const handleInterrupted = () => {
      setVisible(true);
      setFading(false);
    };

    window.addEventListener('generationInterrupted', handleInterrupted);
    return () => {
      window.removeEventListener('generationInterrupted', handleInterrupted);
    };
  }, []);

  // Auto-dismiss after 4 seconds with a fade-out
  useEffect(() => {
    if (visible) {
      const fadeTimer = setTimeout(() => setFading(true), 3000);
      const hideTimer = setTimeout(() => {
        setVisible(false);
        setFading(false);
      }, 3800);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-[200] flex items-center space-x-3 px-5 py-3 rounded-xl shadow-2xl backdrop-blur-xl transition-all duration-700 ${
        fading ? 'opacity-0 translate-y-[-8px]' : 'opacity-100 translate-y-0'
      }`}
      style={{
        background: 'rgba(30, 30, 34, 0.92)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        animation: 'genNotifSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <style jsx>{`
        @keyframes genNotifSlideIn {
          from {
            opacity: 0;
            transform: translateY(-12px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
      <span className="text-sm text-white/90 font-medium">
        Geração de resposta interrompida
      </span>
      <button
        onClick={() => { setVisible(false); setFading(false); }}
        className="ml-1 p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white/80 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
