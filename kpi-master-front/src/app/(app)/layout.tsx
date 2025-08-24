'use client';

import Sidebar from '@/components/Sidebar';
import { useCallback, useEffect, useRef } from 'react';
import Script from 'next/script';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const inited = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const finisherOptions = {
    count: 8,
    size: { min: 200, max: 600, pulse: 0 },
    speed: { x: { min: 0.1, max: 0.3 }, y: { min: 0.1, max: 0.4 } },
    colors: {
      background: '#fe9a00',
      particles: ['#fde68a', '#fcd34d', '#f59e0b', '#b45309'],
    },
    blending: 'overlay',
    opacity: { center: 0.9, edge: 0.1 },
    skew: 0,
    shapes: ['c', 's', 't'],
  } as const;

  const cleanupCanvases = () => {
    const el = containerRef.current;
    if (!el) return;
    el.querySelectorAll('canvas').forEach((c) => c.remove());
  };

  const initFinisher = useCallback(() => {
    if (inited.current) return;
    const win = window as any;
    if (!win?.FinisherHeader || !containerRef.current) return;

    cleanupCanvases();
    // eslint-disable-next-line no-new
    new win.FinisherHeader(finisherOptions);
    inited.current = true;
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).FinisherHeader) {
      initFinisher();
    }
    return () => {
      inited.current = false;
      cleanupCanvases();
    };
  }, [initFinisher]);

  return (
    <div className="min-h-screen flex font-mono">
      <Script
        src="/vendor/finisher-header.es5.min.js"
        strategy="afterInteractive"
        onLoad={initFinisher}
      />

      <Sidebar /> 

      <main
        ref={containerRef}
        className="relative finisher-header flex-1"
      >
        {/* Keep the canvas behind your content */}
        <style jsx global>{`
          .finisher-header canvas {
            position: absolute !important;
            inset: 0;
            width: 100% !important;
            height: 100% !important;
            z-index: 0 !important;
            pointer-events: none;
          }
        `}</style>

        {/* Content layer */}
        <div className="relative z-10 min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}
