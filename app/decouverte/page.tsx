"use client";

import { useState } from "react";
import Header from "@/components/Header";
import DecouverteCardView from "@/components/DecouverteCardView";
import BigButton from "@/components/BigButton";
import { useTheme } from "@/lib/ThemeContext";
import { DECOUVERTE_CARDS } from "@/lib/content/decouverte";

export default function DecouvertePage() {
  const { theme } = useTheme();
  const [index, setIndex] = useState(0);
  const card = DECOUVERTE_CARDS[index];

  function next() {
    setIndex((i) => (i + 1) % DECOUVERTE_CARDS.length);
  }
  function prev() {
    setIndex((i) => (i - 1 + DECOUVERTE_CARDS.length) % DECOUVERTE_CARDS.length);
  }

  return (
    <main className="flex-1 flex flex-col min-h-screen" style={{ backgroundColor: theme.colors.soft }}>
      <Header title="Je découvre 🌍" />
      <div className="flex-1 flex flex-col items-center px-4 pt-2 pb-10 gap-4">
        <div className="flex gap-1.5">
          {DECOUVERTE_CARDS.map((c, i) => (
            <span
              key={c.id}
              className={`h-2.5 w-2.5 rounded-full ${i === index ? "bg-slate-700" : "bg-slate-300"}`}
            />
          ))}
        </div>
        <DecouverteCardView key={card.id} card={card} onDone={() => {}} />
        <div className="flex gap-3">
          <BigButton onClick={prev} className="!py-3 !px-5 text-base">
            ⬅️ Précédent
          </BigButton>
          <BigButton color={theme.colors.primary} onClick={next} className="!py-3 !px-5 text-base">
            Suivant ➡️
          </BigButton>
        </div>
      </div>
    </main>
  );
}
