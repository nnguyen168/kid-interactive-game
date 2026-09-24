"use client";

import { useState } from "react";
import Header from "@/components/Header";
import MathsQuestionCard from "@/components/MathsQuestionCard";
import FrancaisQuestionCard from "@/components/FrancaisQuestionCard";
import HeartLives from "@/components/HeartLives";
import Confetti from "@/components/Confetti";
import BigButton from "@/components/BigButton";
import { useTheme } from "@/lib/ThemeContext";
import { useProgress } from "@/lib/ProgressContext";
import { generateMixedQuestion } from "@/lib/content/mixed";
import { useLazyGenerated } from "@/lib/useLazyGenerated";

const TOTAL_QUESTIONS = 8;
const MAX_LIVES = 3;

type Status = "playing" | "won" | "lost";

export default function JeuPage() {
  const { theme } = useTheme();
  const { progress, ready, addStars, addBadge } = useProgress();
  const [status, setStatus] = useState<Status>("playing");
  const [current, setCurrent] = useLazyGenerated(ready && status === "playing", () =>
    generateMixedQuestion(theme, progress.level)
  );
  const [lives, setLives] = useState(MAX_LIVES);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  function handleAnswer(correct: boolean) {
    setAnswered(true);
    if (!current) return;
    if (correct) {
      addStars(current.subject, 1);
      setScore((s) => s + 1);
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 900);
    } else {
      setLives((l) => Math.max(0, l - 1));
    }
  }

  function next() {
    if (lives <= 0) {
      setStatus("lost");
      return;
    }
    if (score >= TOTAL_QUESTIONS) {
      setStatus("won");
      addBadge(`${theme.id}-jeu-champion`);
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 2200);
      return;
    }
    setAnswered(false);
    setCurrent(generateMixedQuestion(theme, progress.level));
  }

  function restart() {
    setLives(MAX_LIVES);
    setScore(0);
    setAnswered(false);
    setStatus("playing");
    setCurrent(generateMixedQuestion(theme, progress.level));
  }

  return (
    <main className="flex-1 flex flex-col min-h-screen" style={{ backgroundColor: theme.colors.soft }}>
      <Header title={`Je joue ${theme.mascotEmoji}`} />
      <div className="flex-1 flex flex-col items-center px-4 pt-2 pb-10 gap-4">
        {status === "playing" && current && (
          <>
            <div className="flex items-center justify-between w-full max-w-lg mx-auto mb-1 px-1">
              <HeartLives lives={lives} max={MAX_LIVES} />
              <div className="text-sm font-bold text-slate-600">
                Score : {score} / {TOTAL_QUESTIONS}
              </div>
            </div>
            {current.subject === "maths" ? (
              <MathsQuestionCard key={current.question.id} question={current.question} onAnswer={handleAnswer} />
            ) : (
              <FrancaisQuestionCard key={current.question.id} question={current.question} onAnswer={handleAnswer} />
            )}
            {answered && (
              <BigButton color={theme.colors.primary} onClick={next}>
                Suivant ➡️
              </BigButton>
            )}
          </>
        )}

        {status === "won" && (
          <div className="text-center max-w-sm">
            <div className="text-6xl mb-3">{theme.badgeEmoji}</div>
            <h2 className="text-2xl font-extrabold mb-2">Bravo, champion !</h2>
            <p className="text-slate-600 mb-6">
              Tu as gagné le badge « {theme.badgeName} » ! Score : {score} / {TOTAL_QUESTIONS}.
            </p>
            <BigButton color={theme.colors.primary} onClick={restart}>
              Rejouer 🔁
            </BigButton>
          </div>
        )}

        {status === "lost" && (
          <div className="text-center max-w-sm">
            <div className="text-6xl mb-3">💪</div>
            <h2 className="text-2xl font-extrabold mb-2">Bien joué !</h2>
            <p className="text-slate-600 mb-6">
              Score final : {score} / {TOTAL_QUESTIONS}. On réessaye ?
            </p>
            <BigButton color={theme.colors.primary} onClick={restart}>
              Rejouer 🔁
            </BigButton>
          </div>
        )}
      </div>
      <Confetti active={celebrate} />
    </main>
  );
}
