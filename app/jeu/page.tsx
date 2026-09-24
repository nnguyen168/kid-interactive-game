"use client";

import { useState } from "react";
import GameScreen from "@/components/ui/GameScreen";
import CandyButton from "@/components/ui/CandyButton";
import MascotSays from "@/components/ui/MascotSays";
import { ReplayIcon } from "@/components/ui/icons";
import Art from "@/components/Art";
import MixedQuestionCard from "@/components/quiz/MixedQuestionCard";
import ResultScreen from "@/components/quiz/ResultScreen";
import ChallengeTrack from "@/components/quiz/ChallengeTrack";
import { useQuizRound } from "@/components/quiz/useQuizRound";
import { useTheme } from "@/lib/ThemeContext";
import { useProgress } from "@/lib/ProgressContext";
import { generateMixedQuestion } from "@/lib/content/mixed";
import { sfx } from "@/lib/sfx";

const TOTAL = 8;
const MAX_LIVES = 4;

function Hearts({ lives }: { lives: number }) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-white/85 px-3 py-1.5 shadow-[0_5px_0_rgba(0,0,0,0.12)]" aria-label={`${lives} cœurs`}>
      {Array.from({ length: MAX_LIVES }, (_, i) => (
        <Art
          key={`${i}-${i < lives}`}
          name={i < lives ? "heart" : "heart-empty"}
          className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 ${i < lives ? "" : "opacity-40 shake"}`}
          eager
        />
      ))}
    </div>
  );
}

export default function DefiPage() {
  const { theme, themeId } = useTheme();
  const { progress, ready, addStars, addBadge } = useProgress();
  const [lives, setLives] = useState(MAX_LIVES);
  const [lost, setLost] = useState(false);
  const round = useQuizRound({ total: TOTAL, ready, generate: () => generateMixedQuestion(theme, progress.level) });

  function onSolved(firstTry: boolean) {
    const item = round.question;
    if (firstTry && item) {
      addStars(item.subject, 1);
      setTimeout(() => sfx.star(), 350);
    }
    if (round.results.length + 1 >= TOTAL) addBadge(`${themeId}-defi-champion`);
    round.recordResult(firstTry);
  }

  function onWrong(attempt: number) {
    if (attempt !== 1) return;
    const next = lives - 1;
    setLives(next);
    if (next <= 0) setTimeout(() => setLost(true), 1200);
  }

  function restart() {
    setLives(MAX_LIVES);
    setLost(false);
    round.restart();
  }

  const playAgain = (
    <>
      <CandyButton color={theme.colors.primary} onClick={restart} iconRight={<ReplayIcon className="w-8 h-8 lg:w-10 lg:h-10" />}>
        Rejouer
      </CandyButton>
      <CandyButton color="#0EA5E9" href="/" icon="home">
        Maison
      </CandyButton>
    </>
  );

  return (
    <GameScreen top={!round.done && !lost && <Hearts lives={lives} />}>
      {lost ? (
        <div className="flex w-full max-w-4xl flex-col items-center gap-6 pt-6">
          <Art name="heart-empty" className="pop-in w-28 h-28 lg:w-40 lg:h-40" eager />
          <MascotSays
            themeId={themeId}
            mood="encourage"
            size="lg"
            text="Oh non, plus de cœurs ! Ce n'est pas grave, on réessaie ?"
          />
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">{playAgain}</div>
        </div>
      ) : round.done ? (
        <ResultScreen themeId={themeId} correct={round.firstTryCount} total={TOTAL} message={theme.challenge.win}>
          {playAgain}
        </ResultScreen>
      ) : (
        <div className="flex w-full flex-col items-center gap-4 lg:gap-6">
          <ChallengeTrack theme={theme} steps={round.results.length} total={TOTAL} />
          {round.question && (
            <MixedQuestionCard
              key={round.question.question.id}
              item={round.question}
              themeId={themeId}
              onSolved={onSolved}
              onWrong={onWrong}
            />
          )}
        </div>
      )}
    </GameScreen>
  );
}
