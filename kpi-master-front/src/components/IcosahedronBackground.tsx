'use client';

import { useEffect, useRef } from 'react';

// ─── Golden ratio ─────────────────────────────────────────────────────────────
const PHI = (1 + Math.sqrt(5)) / 2;

// ─── 20 dodecahedron vertices (on a sphere of radius √3) ─────────────────────
// Group 1: (±1, ±1, ±1)  — 8 vertices
// Group 2: (0, ±1/φ, ±φ) — 4 vertices
// Group 3: (±1/φ, ±φ, 0) — 4 vertices
// Group 4: (±φ, 0, ±1/φ) — 4 vertices
const RAW_VERTS: [number, number, number][] = [
    // 0-7 : cube corners
    [ 1,  1,  1], [ 1,  1, -1], [ 1, -1,  1], [ 1, -1, -1],
    [-1,  1,  1], [-1,  1, -1], [-1, -1,  1], [-1, -1, -1],
    // 8-11 : elongated along Z
    [0,  1/PHI,  PHI], [0,  1/PHI, -PHI],
    [0, -1/PHI,  PHI], [0, -1/PHI, -PHI],
    // 12-15 : elongated along Y
    [ 1/PHI,  PHI, 0], [ 1/PHI, -PHI, 0],
    [-1/PHI,  PHI, 0], [-1/PHI, -PHI, 0],
    // 16-19 : elongated along X
    [ PHI, 0,  1/PHI], [ PHI, 0, -1/PHI],
    [-PHI, 0,  1/PHI], [-PHI, 0, -1/PHI],
];

// Normalize to unit sphere (all vertices sit at radius √3)
const NORM = Math.sqrt(3);
const VERTS: [number, number, number][] = RAW_VERTS.map(
    ([x, y, z]) => [x / NORM, y / NORM, z / NORM]
);

// ─── 12 pentagonal faces (CCW when viewed from outside) ──────────────────────
const FACES: number[][] = [
    [ 0,  8, 10,  2, 16],   // front-top
    [ 0, 16, 17,  1, 12],   // right-top
    [ 0, 12, 14,  4,  8],   // left-top
    [ 5, 14, 12,  1,  9],   // top-back-left
    [ 5,  9, 11,  7, 19],   // back-left
    [ 5, 19, 18,  4, 14],   // left-back
    [ 3, 11,  9,  1, 17],   // right-back
    [ 3, 17, 16,  2, 13],   // front-right-lower
    [ 3, 13, 15,  7, 11],   // bottom-back-right
    [ 6, 15, 13,  2, 10],   // front-bottom
    [ 6, 10,  8,  4, 18],   // left-bottom
    [ 6, 18, 19,  7, 15],   // bottom-back
];

// ─── Rotation axis (1, 1, 0.5) — normalized ──────────────────────────────────
const AX_LEN = Math.sqrt(1 + 1 + 0.25);
const UX = 1 / AX_LEN, UY = 1 / AX_LEN, UZ = 0.5 / AX_LEN;

/** Rodrigues' rotation of vector v around the fixed diagonal axis by angle a */
function rotateVec(v: [number, number, number], a: number): [number, number, number] {
    const cos = Math.cos(a), sin = Math.sin(a), k = 1 - cos;
    return [
        v[0] * (cos + UX * UX * k) + v[1] * (UX * UY * k - UZ * sin) + v[2] * (UX * UZ * k + UY * sin),
        v[0] * (UY * UX * k + UZ * sin) + v[1] * (cos + UY * UY * k) + v[2] * (UY * UZ * k - UX * sin),
        v[0] * (UZ * UX * k - UY * sin) + v[1] * (UZ * UY * k + UX * sin) + v[2] * (cos + UZ * UZ * k),
    ];
}

/** Perspective-project a 3-D point to 2-D canvas coords */
function project(
    v: [number, number, number],
    cx: number, cy: number,
    scale: number, dist: number
): [number, number] {
    const z = v[2] + dist;
    return [cx + (v[0] / z) * scale, cy + (v[1] / z) * scale];
}

// Fixed canvas size — parent overflow:hidden clips it
const CANVAS_SIZE = 700;

export function IcosahedronBackground() {
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

            const cx    = BUF / 2;
            const cy    = BUF / 2;
            const scale = BUF * 1.0;
            const dist  = 2.6;

            // Rotate all 20 vertices
            const rotated = VERTS.map(v => rotateVec(v, angle));

            // Project to 2-D
            const pts = rotated.map(v => project(v, cx, cy, scale, dist));

            // Sort faces back-to-front (painter's algorithm, average Z of face)
            const sorted = FACES.map(f => ({
                f,
                depth: f.reduce((s, i) => s + rotated[i][2], 0) / f.length,
            })).sort((a, b) => a.depth - b.depth);

            sorted.forEach(({ f }) => {
                // Front-face test: cross product of first two edges (Z component)
                const [ax, ay] = pts[f[0]];
                const [bx, by] = pts[f[1]];
                const [cx2, cy2] = pts[f[2]];
                const cross = (bx - ax) * (cy2 - ay) - (by - ay) * (cx2 - ax);
                const front = cross > 0;

                const edgeAlpha = front ? 0.28 : 0.08;
                const fillAlpha = front ? 0.05 : 0.01;

                // Draw pentagon
                ctx.beginPath();
                ctx.moveTo(pts[f[0]][0], pts[f[0]][1]);
                for (let i = 1; i < f.length; i++) {
                    ctx.lineTo(pts[f[i]][0], pts[f[i]][1]);
                }
                ctx.closePath();

                ctx.fillStyle   = `rgba(210, 210, 220, ${fillAlpha})`;
                ctx.fill();
                ctx.strokeStyle = `rgba(200, 200, 215, ${edgeAlpha})`;
                ctx.lineWidth   = 1.5;
                ctx.stroke();
            });

            angle += 0.0015;
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
                position:      'absolute',
                width:         `${CANVAS_SIZE}px`,
                height:        `${CANVAS_SIZE}px`,
                top:           '50%',
                right:         -300,
                transform:     'translateY(-50%)',
                opacity:       0.25,
                pointerEvents: 'none',
            }}
        />
    );
}
