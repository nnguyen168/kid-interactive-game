"use client";

import { ReactNode, useEffect } from "react";
import { ThemeId } from "@/lib/types";
import { sfx } from "@/lib/sfx";
import Art from "../Art";
import Confetti from "../Confetti";
import MascotSays from "../ui/MascotSays";

export function starsFor(correct: number, total: number): number {
  const ratio = total > 0 ? correct / total : 0;
  if (ratio >= 0.85) return 3;
  if (ratio >= 0.5) return 2;
  return 1;
}

export default function ResultScreen({
  themeId,
  correct,
  total,
  message,
  children,
}: {
  themeId: ThemeId;
  correct: number;
  total: number;
  message?: string;
  children: ReactNode;
}) {
  const stars = starsFor(correct, total);
  const text =
    message ??
    (stars === 3 ? "Incroyable ! Trois étoiles !" : stars === 2 ? "Super travail ! Deux étoiles !" : "Bien joué ! Tu progresses !");

  useEffect(() => {
    sfx.fanfare();
    const timers = Array.from({ length: stars }, (_, i) => setTimeout(() => sfx.star(), 650 + i * 380));
    return () => timers.forEach(clearTimeout);
  }, [stars]);

  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-4 pt-2 lg:gap-6">
      <Confetti active amount={70} />
      <div className="flex items-end justify-center gap-2 sm:gap-6">
        {[0, 1, 2].map((i) => (
          <span key={i} className={`pop-in ${i === 1 ? "-translate-y-6 sm:-translate-y-10" : ""}`} style={{ animationDelay: `${600 + i * 380}ms` }}>
            <Art
              name={i < stars ? "glowing-star" : "star"}
              className={`w-24 h-24 sm:w-32 sm:h-32 lg:w-44 lg:h-44 ${i < stars ? "drop-shadow-[0_8px_0_rgba(0,0,0,0.15)]" : "opacity-50 brightness-0 invert"}`}
              eager
            />
          </span>
        ))}
      </div>
      <div className="rounded-full bg-white/90 px-6 py-2 text-xl sm:text-2xl lg:text-3xl font-bold text-slate-700 shadow-[0_5px_0_rgba(0,0,0,0.1)]">
        {correct} / {total} du premier coup
      </div>
      <MascotSays
        themeId={themeId}
        mood="happy"
        size="lg"
        text={text}
        speakText={`${text} Tu as trouvé ${correct} réponses du premier coup !`}
      />
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">{children}</div>
    </div>
  );
}
