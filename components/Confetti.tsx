"use client";

import { useEffect, useState } from "react";

const PIECES = ["⭐", "🎉", "✨", "🏅"];

type Piece = { id: number; left: number; delay: number; duration: number; emoji: string };

export default function Confetti({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (!active) return;
    // Randomized burst layout is computed here (not during render) so each
    // burst gets a fresh pattern without calling Math.random during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPieces(
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        emoji: PIECES[Math.floor(Math.random() * PIECES.length)],
        duration: 1.2 + Math.random() * 0.8,
      }))
    );
  }, [active]);

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-[-10%] text-2xl confetti-piece"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}
