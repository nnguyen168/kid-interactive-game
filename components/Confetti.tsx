"use client";

import { useEffect, useState } from "react";

const COLORS = ["#F43F5E", "#F59E0B", "#10B981", "#3B82F6", "#A855F7", "#FACC15", "#EC4899"];

type Piece = { id: number; left: number; delay: number; duration: number; color: string; w: number; h: number };

export default function Confetti({ active, amount = 40 }: { active: boolean; amount?: number }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (!active) return;
    // Randomized layout is computed here (not during render) so each burst
    // gets a fresh pattern without calling Math.random during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPieces(
      Array.from({ length: amount }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.35,
        duration: 1.4 + Math.random() * 1,
        color: COLORS[i % COLORS.length],
        w: 8 + Math.random() * 8,
        h: 12 + Math.random() * 10,
      }))
    );
  }, [active, amount]);

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece absolute top-0 rounded-[3px]"
          style={{
            left: `${p.left}%`,
            width: p.w,
            height: p.h,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
