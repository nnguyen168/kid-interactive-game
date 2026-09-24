"use client";

import { useState } from "react";
import Header from "@/components/Header";
import FrancaisQuestionCard from "@/components/FrancaisQuestionCard";
import Confetti from "@/components/Confetti";
import BigButton from "@/components/BigButton";
import { useTheme } from "@/lib/ThemeContext";
import { useProgress } from "@/lib/ProgressContext";
import { generateFrancaisQuestion } from "@/lib/content/francais";
import { useLazyGenerated } from "@/lib/useLazyGenerated";

const ROUND_COUNT = 8;

export default function FrancaisPage() {
  const { theme } = useTheme();
  const { progress, ready, addStars, starsToNextLevel } = useProgress();
  const [question, setQuestion] = useLazyGenerated(ready, () =>
    generateFrancaisQuestion(theme, progress.level.francais)
  );
  const [answered, setAnswered] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [round, setRound] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);

  function handleAnswer(correct: boolean) {
    setAnswered(true);
    if (correct) {
      addStars("francais", 1);
      setCorrectCount((c) => c + 1);
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 1400);
    }
  }

  function next() {
    if (round + 1 >= ROUND_COUNT) {
      setDone(true);
      return;
    }
    setRound((r) => r + 1);
    setAnswered(false);
    setQuestion(generateFrancaisQuestion(theme, progress.level.francais));
  }

  function restart() {
    setRound(0);
    setCorrectCount(0);
    setDone(false);
    setAnswered(false);
    setQuestion(generateFrancaisQuestion(theme, progress.level.francais));
  }

  const toNext = starsToNextLevel("francais");

  return (
    <main className="flex-1 flex flex-col min-h-screen" style={{ backgroundColor: theme.colors.soft }}>
      <Header title="Français 🔤" />
      <div className="flex-1 flex flex-col items-center px-4 pt-2 pb-10 gap-4 lg:gap-6">
        {!done && (
          <div className="text-sm lg:text-lg font-bold text-slate-600 text-center">
            Niveau {progress.level.francais} · question {round + 1} / {ROUND_COUNT}
            {toNext !== null && <> · encore {toNext} ⭐ pour le niveau suivant</>}
          </div>
        )}

        {!done && question && (
          <FrancaisQuestionCard key={question.id} question={question} onAnswer={handleAnswer} />
        )}
        {!done && answered && (
          <BigButton color={theme.colors.primary} onClick={next}>
            {round + 1 >= ROUND_COUNT ? "Voir mes résultats 🏁" : "Question suivante ➡️"}
          </BigButton>
        )}

        {done && (
          <div className="text-center max-w-sm lg:max-w-lg pt-8">
            <div className="text-6xl lg:text-8xl mb-3">🎉</div>
            <h2 className="text-2xl lg:text-4xl font-extrabold mb-2">Bravo !</h2>
            <p className="text-slate-600 lg:text-xl mb-6">
              Tu as trouvé {correctCount} / {ROUND_COUNT} bonnes réponses.
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
