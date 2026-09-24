"use client";

import { useState } from "react";
import Header from "@/components/Header";
import MathsQuestionCard from "@/components/MathsQuestionCard";
import Confetti from "@/components/Confetti";
import BigButton from "@/components/BigButton";
import { useTheme } from "@/lib/ThemeContext";
import { useProgress } from "@/lib/ProgressContext";
import { generateMathsQuestion } from "@/lib/content/maths";
import { useLazyGenerated } from "@/lib/useLazyGenerated";

export default function MathsPage() {
  const { theme } = useTheme();
  const { progress, ready, addStars, starsToNextLevel } = useProgress();
  const [question, setQuestion] = useLazyGenerated(ready, () =>
    generateMathsQuestion(theme, progress.level.maths)
  );
  const [answered, setAnswered] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  function handleAnswer(correct: boolean) {
    setAnswered(true);
    if (correct) {
      addStars("maths", 1);
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 1400);
    }
  }

  function next() {
    setAnswered(false);
    setQuestion(generateMathsQuestion(theme, progress.level.maths));
  }

  const toNext = starsToNextLevel("maths");

  return (
    <main className="flex-1 flex flex-col min-h-screen" style={{ backgroundColor: theme.colors.soft }}>
      <Header title="Maths 🔢" />
      <div className="flex-1 flex flex-col items-center px-4 pt-2 pb-10 gap-4">
        <div className="text-sm font-bold text-slate-600 text-center">
          Niveau {progress.level.maths}
          {toNext !== null && <> · encore {toNext} ⭐ pour le niveau suivant</>}
        </div>
        {question && (
          <MathsQuestionCard key={question.id} question={question} onAnswer={handleAnswer} />
        )}
        {answered && (
          <BigButton color={theme.colors.primary} onClick={next}>
            Question suivante ➡️
          </BigButton>
        )}
      </div>
      <Confetti active={celebrate} />
    </main>
  );
}
