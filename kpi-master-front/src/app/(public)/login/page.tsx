'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
    new win.FinisherHeader(finisherOptions);
    inited.current = true;
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:8080/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const resultText = await response.text();

      if (!response.ok) throw new Error(resultText || 'Login failed');

      // ✅ Save JWT token and username
      const payload = JSON.parse(resultText);
      localStorage.setItem('token', payload.token);
      localStorage.setItem('username', payload.username);
      localStorage.setItem('institution',payload.institution )
      localStorage.setItem('role',payload.role )
      localStorage.setItem('profileImageUrl', payload.profileImageUrl || '' )
      localStorage.setItem('email',payload.email )
      console.log("result text:" + resultText)
      alert('Login successful!');
      router.push('/main');

      // router.push('/dashboard'); // or wherever you want to redirect
    } catch (error: any) {
      alert('Login failed: ' + error.message);
    }
  };
  
  return (
    <div ref={containerRef} className="finisher-header min-h-screen flex items-center justify-center relative">
      <Script
        src="/vendor/finisher-header.es5.min.js"
        strategy="afterInteractive"
        onLoad={initFinisher}
      />

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


      <div className="relative z-10 p-8 bg-white/80 backdrop-blur-sm shadow-lg rounded-lg w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-4 text-amber-500">Login</h1>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full mb-3 px-3 py-2 border rounded placeholder:text-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-amber-500"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full mb-3 px-3 py-2 border rounded placeholder:text-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-black"
            required
          />
          <button type="submit" className="w-full py-2 bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors">
            Login
          </button>
        </form>
        <button
          onClick={() => router.push('/register')}
          className="w-full mt-3 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
        >
          Don't have an account? Register
        </button>
      </div>
    </div>
  );
}