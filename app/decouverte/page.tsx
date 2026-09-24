"use client";

import { useState } from "react";
import GameScreen from "@/components/ui/GameScreen";
import MascotSays from "@/components/ui/MascotSays";
import CandyButton, { CANDY_PRESS, candyStyle } from "@/components/ui/CandyButton";
import Art from "@/components/Art";
import Confetti from "@/components/Confetti";
import StoryReader from "@/components/quiz/StoryReader";
import { useTheme } from "@/lib/ThemeContext";
import { useProgress } from "@/lib/ProgressContext";
import { DECOUVERTE_CARDS } from "@/lib/content/decouverte";
import { DecouverteCard } from "@/lib/types";
import { sfx } from "@/lib/sfx";

const BOOK_COLORS = ["#0EA5E9", "#F97316", "#8B5CF6", "#F59E0B", "#14B8A6"];

export default function DecouvertePage() {
  const { theme, themeId } = useTheme();
  const { progress, addBadge } = useProgress();
  const [card, setCard] = useState<DecouverteCard | null>(null);
  const [finished, setFinished] = useState(false);

  function open(c: DecouverteCard) {
    sfx.whoosh();
    setFinished(false);
    setCard(c);
  }

  function onFinish() {
    if (!card) return;
    addBadge(`decouverte-${card.id}`);
    setTimeout(() => setFinished(true), 1600);
  }

  if (card && finished) {
    return (
      <GameScreen>
        <Confetti active amount={60} />
        <div className="flex w-full max-w-4xl flex-col items-center gap-6 pt-4">
          <div className="flex items-center gap-4">
            <Art name={card.art[0]} className="pop-in w-24 h-24 lg:w-36 lg:h-36" eager />
            <Art name="glowing-star" className="pop-in w-20 h-20 lg:w-28 lg:h-28" eager />
          </div>
          <MascotSays themeId={themeId} mood="happy" size="lg" text="Bravo ! Tu as appris quelque chose de nouveau !" />
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <CandyButton color={theme.colors.primary} icon="book" onClick={() => setCard(null)}>
              Une autre histoire
            </CandyButton>
            <CandyButton color="#0EA5E9" href="/" icon="home">
              Maison
            </CandyButton>
          </div>
        </div>
      </GameScreen>
    );
  }

  if (card) {
    return (
      <GameScreen>
        <StoryReader key={card.id} card={card} themeId={themeId} onFinish={onFinish} />
      </GameScreen>
    );
  }

  return (
    <GameScreen>
      <div className="flex w-full flex-col items-center gap-4 lg:gap-8">
        <MascotSays themeId={themeId} text="Choisis une histoire à découvrir !" speakKey="shelf" />
        <div className="grid w-full grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5 lg:gap-7">
          {DECOUVERTE_CARDS.map((c, i) => {
            const read = progress.badges.includes(`decouverte-${c.id}`);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => open(c)}
                className={`wiggle-hover rise-in relative flex flex-col items-center gap-2 rounded-[2rem] px-3 pb-4 pt-5 text-white ${CANDY_PRESS}`}
                style={{ ...candyStyle(BOOK_COLORS[i % BOOK_COLORS.length]), animationDelay: `${i * 80}ms` }}
              >
                <span className="absolute inset-y-3 left-2 w-2 rounded-full bg-black/10" />
                <span className="wiggle-target flex items-center">
                  <Art name={c.art[0]} className="w-20 h-20 lg:w-28 lg:h-28" eager />
                </span>
                <span className="text-lg font-bold leading-tight lg:text-2xl" style={{ textShadow: "0 2px 0 rgba(0,0,0,0.2)" }}>
                  {c.title}
                </span>
                {read && (
                  <span className="pop-in absolute -right-3 -top-3">
                    <Art name="glowing-star" className="w-12 h-12 lg:w-14 lg:h-14" eager />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </GameScreen>
  );
}
