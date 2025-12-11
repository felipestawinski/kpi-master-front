'use client';

import Sidebar from '@/components/Sidebar';
import { useCallback, useEffect, useRef } from 'react';
import Script from 'next/script';
import { Inter, Roboto, Poppins } from 'next/font/google'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const inited = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const finisherOptions = {
    count: 5,
    size: { min: 900, max: 1500, pulse: 0 },
    speed: { x: { min: 0, max: 0.3 }, y: { min: 0, max: 0 } },
    colors: {
      background: '#0f172a',
      particles: ['#35323aff', '#252b3a', '#0b0e13ff', '#706e6cff'],
    },
    blending: 'lighten',
    opacity: { center: 0.15, edge: 0.05 },
    skew: 0,
    shapes: ['s'],
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
    <div 
      ref={containerRef}
      className="min-h-screen flex finisher-header relative"
    >
      <Script
        src="/vendor/finisher-header.es5.min.js"
        strategy="afterInteractive"
        onLoad={initFinisher}
      />

      {/* Global styles for the animated background */}
      <style jsx global>{`
        .finisher-header canvas {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          z-index: 1 !important;
          pointer-events: none !important;
        }
      `}</style>

      <Sidebar />
      

      {/* Main content area */}
      <main className="relative z-10 flex-1">
        {children}
      </main>
    </div>
  );
}