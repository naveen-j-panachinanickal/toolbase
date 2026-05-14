"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * GlobalBackground — fixed canvas-based animated background.
 *
 * Dark:  drifting blue particle network + two slow glow orbs.
 * Light: richer blue/indigo/purple orbs + clearly visible particle mesh.
 *
 * CPU-light: 40 nodes, requestAnimationFrame only. No external deps.
 */
export function GlobalBackground() {
  const pathname = usePathname();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isHomeOrAbout = pathname === "/" || pathname === "/about";

  useEffect(() => {
    if (!isHomeOrAbout) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let W = 0;
    let H = 0;

    const isDark = () => document.documentElement.classList.contains("dark");

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    /* ── nodes ── */
    const NODE_COUNT = 42;
    const CONNECT_DIST = 190;

    type Node = { x: number; y: number; vx: number; vy: number; r: number };

    const nodes: Node[] = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 2 + 1,
    }));

    let orb1Angle = 0;
    let orb2Angle = Math.PI;
    let orb3Angle = Math.PI * 0.5;

    /* ── draw ── */
    const draw = () => {
      const dark = isDark();

      /* Base fill */
      ctx.fillStyle = dark ? "#191A23" : "#f5f5f7";
      ctx.fillRect(0, 0, W, H);

      if (dark) {
        /* ── Dark orbs ── */
        orb1Angle += 0.0005;
        orb2Angle += 0.0003;

        const o1x = W * 0.5 + Math.cos(orb1Angle) * W * 0.28;
        const o1y = H * 0.4 + Math.sin(orb1Angle * 1.3) * H * 0.18;
        const o2x = W * 0.5 + Math.cos(orb2Angle) * W * 0.22;
        const o2y = H * 0.6 + Math.sin(orb2Angle * 0.9) * H * 0.22;

        const g1 = ctx.createRadialGradient(o1x, o1y, 0, o1x, o1y, W * 0.38);
        g1.addColorStop(0, "rgba(52,87,213,0.18)");
        g1.addColorStop(1, "rgba(52,87,213,0)");
        ctx.fillStyle = g1;
        ctx.fillRect(0, 0, W, H);

        const g2 = ctx.createRadialGradient(o2x, o2y, 0, o2x, o2y, W * 0.3);
        g2.addColorStop(0, "rgba(6,182,212,0.10)");
        g2.addColorStop(1, "rgba(6,182,212,0)");
        ctx.fillStyle = g2;
        ctx.fillRect(0, 0, W, H);

      } else {
        /* ── Light orbs — three drifting colored blooms ── */
        orb1Angle += 0.0004;
        orb2Angle += 0.00028;
        orb3Angle += 0.00018;

        /* Blue orb — top-right area */
        const o1x = W * 0.65 + Math.cos(orb1Angle) * W * 0.22;
        const o1y = H * 0.28 + Math.sin(orb1Angle * 1.1) * H * 0.14;
        const g1 = ctx.createRadialGradient(o1x, o1y, 0, o1x, o1y, W * 0.38);
        g1.addColorStop(0, "rgba(43,140,238,0.22)");
        g1.addColorStop(0.5, "rgba(43,140,238,0.08)");
        g1.addColorStop(1, "rgba(43,140,238,0)");
        ctx.fillStyle = g1;
        ctx.fillRect(0, 0, W, H);

        /* Indigo orb — bottom-left */
        const o2x = W * 0.28 + Math.cos(orb2Angle) * W * 0.18;
        const o2y = H * 0.68 + Math.sin(orb2Angle * 0.85) * H * 0.18;
        const g2 = ctx.createRadialGradient(o2x, o2y, 0, o2x, o2y, W * 0.32);
        g2.addColorStop(0, "rgba(99,102,241,0.18)");
        g2.addColorStop(0.5, "rgba(99,102,241,0.06)");
        g2.addColorStop(1, "rgba(99,102,241,0)");
        ctx.fillStyle = g2;
        ctx.fillRect(0, 0, W, H);

        /* Cyan accent — center-right */
        const o3x = W * 0.78 + Math.cos(orb3Angle * 1.4) * W * 0.14;
        const o3y = H * 0.55 + Math.sin(orb3Angle) * H * 0.22;
        const g3 = ctx.createRadialGradient(o3x, o3y, 0, o3x, o3y, W * 0.22);
        g3.addColorStop(0, "rgba(6,182,212,0.12)");
        g3.addColorStop(1, "rgba(6,182,212,0)");
        ctx.fillStyle = g3;
        ctx.fillRect(0, 0, W, H);
      }

      /* ── Connection lines ── */
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DIST) {
            const t = 1 - dist / CONNECT_DIST;
            const alpha = dark ? t * 0.15 : t * 0.22;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = dark
              ? `rgba(100,140,255,${alpha})`
              : `rgba(43,100,210,${alpha})`;
            ctx.lineWidth = dark ? 0.8 : 1;
            ctx.stroke();
          }
        }
      }

      /* ── Dots ── */
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = dark
          ? "rgba(120,160,255,0.40)"
          : "rgba(43,100,210,0.30)";
        ctx.fill();

        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    const observer = new MutationObserver(() => { /* draw() reads isDark() live */ });
    observer.observe(document.documentElement, { attributeFilter: ["class"] });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      observer.disconnect();
    };
  }, [isHomeOrAbout]);

  if (!isHomeOrAbout) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
