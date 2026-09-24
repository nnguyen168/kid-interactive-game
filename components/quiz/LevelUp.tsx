"use client";

import { useState } from "react";
import { sfx } from "@/lib/sfx";
import { speak } from "@/lib/speech";
import Art from "../Art";
import Confetti from "../Confetti";

export function useLevelUp() {
  const [level, setLevel] = useState<number | null>(null);

  function celebrate(newLevel: number) {
    setLevel(newLevel);
    sfx.fanfare();
    speak(`Bravo ! Tu passes au niveau ${newLevel} !`);
    setTimeout(() => setLevel(null), 2800);
  }

  return { level, celebrate };
}

export function LevelUpToast({ level }: { level: number | null }) {
  if (!level) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-24 z-40 flex justify-center lg:top-32">
      <Confetti active amount={50} />
      <div className="pop-in flex items-center gap-3 rounded-full border-4 border-amber-300 bg-white px-6 py-3 shadow-2xl lg:px-10 lg:py-4">
        <Art name="rocket" className="w-12 h-12 lg:w-16 lg:h-16" eager />
        <span className="text-3xl lg:text-5xl font-bold text-violet-600">Niveau {level} !</span>
      </div>
    </div>
  );
}
