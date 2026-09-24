"use client";

import { useState } from "react";
import SpeakButton from "./SpeakButton";
import { DecouverteCard } from "@/lib/types";

export default function DecouverteCardView({
  card,
  onDone,
}: {
  card: DecouverteCard;
  onDone: (correct: boolean) => void;
}) {
  const [showQuiz, setShowQuiz] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  const fullText = `${card.question} ${card.explanation.join(" ")}`;

  function handleSelect(i: number) {
    if (selected !== null) return;
    setSelected(i);
    onDone(i === card.quiz.answerIndex);
  }

  return (
    <div className="w-full max-w-xl mx-auto rounded-3xl bg-white p-6 shadow-xl">
      <div className="text-center text-6xl mb-3">{card.emoji}</div>
      <div className="flex items-start gap-3 mb-4">
        <SpeakButton text={showQuiz ? card.quiz.question : fullText} />
        <h2 className="text-xl font-extrabold flex-1 pt-2">{card.question}</h2>
      </div>

      {!showQuiz && (
        <>
          <ul className="space-y-2 mb-6">
            {card.explanation.map((line, i) => (
              <li key={i} className="text-lg text-slate-700 leading-relaxed">
                {line}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setShowQuiz(true)}
            className="w-full rounded-2xl bg-indigo-600 text-white text-lg font-extrabold py-4 shadow active:scale-95 transition-transform"
          >
            Le petit quiz ! 🧠
          </button>
        </>
      )}

      {showQuiz && (
        <>
          <p className="text-lg font-bold mb-4 text-center">{card.quiz.question}</p>
          <div className="flex flex-col gap-3">
            {card.quiz.choices.map((choice, i) => {
              const isCorrect = i === card.quiz.answerIndex;
              const isSelected = i === selected;
              let stateClasses = "bg-slate-100 text-slate-800";
              if (selected !== null) {
                if (isCorrect) stateClasses = "bg-green-500 text-white";
                else if (isSelected) stateClasses = "bg-red-400 text-white";
                else stateClasses = "bg-slate-100 text-slate-400";
              }
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelect(i)}
                  disabled={selected !== null}
                  className={`rounded-2xl py-4 px-4 text-lg font-bold text-left shadow active:scale-95 transition-transform ${stateClasses}`}
                >
                  {choice}
                </button>
              );
            })}
          </div>
          {selected !== null && (
            <p className="text-center mt-4 text-lg font-bold">
              {selected === card.quiz.answerIndex
                ? "🎉 Bravo, tu as tout compris !"
                : "😊 Pas tout à fait, mais tu as bien écouté !"}
            </p>
          )}
        </>
      )}
    </div>
  );
}
