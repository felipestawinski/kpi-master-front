'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

// ─── Icosahedron math (same as IcosahedronBackground.tsx) ───────────────────

const PHI = (1 + Math.sqrt(5)) / 2;

const RAW_VERTS: [number, number, number][] = [
  [0, 1, PHI], [0, -1, PHI], [0, 1, -PHI], [0, -1, -PHI],
  [1, PHI, 0], [-1, PHI, 0], [1, -PHI, 0], [-1, -PHI, 0],
  [PHI, 0, 1], [-PHI, 0, 1], [PHI, 0, -1], [-PHI, 0, -1],
];

const NORM = Math.sqrt(1 + PHI * PHI);
const VERTS: [number, number, number][] = RAW_VERTS.map(
  ([x, y, z]) => [x / NORM, y / NORM, z / NORM]
);

const FACES: [number, number, number][] = [
  [0, 1, 8], [0, 8, 4], [0, 4, 5], [0, 5, 9], [0, 9, 1],
  [1, 6, 8], [8, 6, 10], [8, 10, 4], [4, 10, 2], [4, 2, 5],
  [5, 2, 11], [5, 11, 9], [9, 11, 7], [9, 7, 1], [1, 7, 6],
  [3, 6, 7], [3, 7, 11], [3, 11, 2], [3, 2, 10], [3, 10, 6],
];

const AX_LEN = Math.sqrt(1 + 1 + 0.25);
const UX = 1 / AX_LEN, UY = 1 / AX_LEN, UZ = 0.5 / AX_LEN;

function rotateVec(v: [number, number, number], a: number): [number, number, number] {
  const cos = Math.cos(a), sin = Math.sin(a), k = 1 - cos;
  return [
    v[0] * (cos + UX * UX * k) + v[1] * (UX * UY * k - UZ * sin) + v[2] * (UX * UZ * k + UY * sin),
    v[0] * (UY * UX * k + UZ * sin) + v[1] * (cos + UY * UY * k) + v[2] * (UY * UZ * k - UX * sin),
    v[0] * (UZ * UX * k - UY * sin) + v[1] * (UZ * UY * k + UX * sin) + v[2] * (cos + UZ * UZ * k),
  ];
}

function project(
  v: [number, number, number],
  cx: number, cy: number,
  scale: number, dist: number
): [number, number] {
  const z = v[2] + dist;
  return [cx + (v[0] / z) * scale, cy + (v[1] / z) * scale];
}

// ─── Smaller canvas for lobby ────────────────────────────────────────────────

const CANVAS_SIZE = 280;

function LobbyIcosahedron() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const BUF = Math.round(CANVAS_SIZE * dpr);
    canvas.width = BUF;
    canvas.height = BUF;

    let angle = 0;
    let animId: number;

    const draw = () => {
      ctx.clearRect(0, 0, BUF, BUF);

      const cx = BUF / 2;
      const cy = BUF / 2;
      const scale = BUF * 1.0;
      const dist = 2.6;

      const rotated = VERTS.map(v => rotateVec(v, angle));
      const pts = rotated.map(v => project(v, cx, cy, scale, dist));

      const sorted = FACES.map(f => ({
        f,
        depth: (rotated[f[0]][2] + rotated[f[1]][2] + rotated[f[2]][2]) / 3,
        cross: (() => {
          const [ax, ay] = pts[f[0]];
          const [bx, by] = pts[f[1]];
          const [cx2, cy2] = pts[f[2]];
          return (bx - ax) * (cy2 - ay) - (by - ay) * (cx2 - ax);
        })(),
      })).sort((a, b) => a.depth - b.depth);

      // ── Pass 1: fills only (painter order, no stroke) ──────────────────────
      sorted.forEach(({ f, cross }) => {
        const front = cross > 0;
        const fillAlpha = front ? 0.12 : 0.03;

        ctx.beginPath();
        ctx.moveTo(pts[f[0]][0], pts[f[0]][1]);
        ctx.lineTo(pts[f[1]][0], pts[f[1]][1]);
        ctx.lineTo(pts[f[2]][0], pts[f[2]][1]);
        ctx.closePath();

        ctx.fillStyle = `rgba(245, 158, 11, ${fillAlpha})`;
        ctx.fill();
      });

      // ── Pass 2: edges — each drawn exactly once via a dedup Set ────────────
      // This eliminates the double-paint at shared vertices that causes sparkling.
      const drawnEdges = new Set<string>();

      // Build a map of vertex → whether that vertex belongs to any front face,
      // so we can pick the right alpha for each edge.
      const frontFaces = new Set(sorted.filter(s => s.cross > 0).map(s => s.f));

      ctx.lineWidth = 1.8;

      sorted.forEach(({ f, cross }) => {
        const front = cross > 0;
        const edgeAlpha = front ? 0.85 : 0.20;

        for (let i = 0; i < 3; i++) {
          const a = f[i], b = f[(i + 1) % 3];
          const key = a < b ? `${a}_${b}` : `${b}_${a}`;
          if (drawnEdges.has(key)) continue;
          drawnEdges.add(key);

          ctx.beginPath();
          ctx.moveTo(pts[a][0], pts[a][1]);
          ctx.lineTo(pts[b][0], pts[b][1]);
          ctx.strokeStyle = `rgba(245, 158, 11, ${edgeAlpha})`;
          ctx.stroke();
        }
      });

      angle += 0.007;
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => { cancelAnimationFrame(animId); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        width: `${CANVAS_SIZE}px`,
        height: `${CANVAS_SIZE}px`,
        display: 'block',
        filter: 'drop-shadow(0 0 32px rgba(245,158,11,0.35))',
      }}
    />
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LobbyPage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center bg-zinc-900"
      style={{ background: 'rgba(24,24,27,0.97)' }}
    >
      {/* Icosahedron */}
      <LobbyIcosahedron />

      {/* Greeting */}
      <p
        className="mt-6 text-2xl font-semibold tracking-wide text-zinc-100"
        style={{ letterSpacing: '0.04em' }}
      >
        Bem vindo ao projeto{' '}
        <span className="text-amber-500">KPI</span>
      </p>

      {/* Actions */}
      <div className="mt-8 flex gap-4">
        <Link
          href="/login"
          className="px-7 py-2.5 rounded-lg font-semibold text-zinc-900 bg-amber-500 hover:bg-amber-400 transition-colors duration-200 shadow-lg shadow-amber-500/20"
        >
          Entrar
        </Link>
        <Link
          href="/register"
          className="px-7 py-2.5 rounded-lg font-semibold text-amber-500 border border-amber-500 hover:bg-amber-500/10 transition-colors duration-200"
        >
          Registrar
        </Link>
      </div>
    </main>
  );
}
