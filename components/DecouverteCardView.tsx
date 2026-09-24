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
    <div className="w-full max-w-xl lg:max-w-3xl mx-auto rounded-3xl bg-white p-6 lg:p-10 shadow-xl">
      <div className="text-center text-6xl lg:text-8xl mb-3 lg:mb-5">{card.emoji}</div>
      <div className="flex items-start gap-3 lg:gap-4 mb-4 lg:mb-6">
        <SpeakButton text={showQuiz ? card.quiz.question : fullText} />
        <h2 className="text-xl lg:text-3xl font-extrabold flex-1 pt-2 lg:pt-3">{card.question}</h2>
      </div>

      {!showQuiz && (
        <>
          <ul className="space-y-2 lg:space-y-3 mb-6 lg:mb-8">
            {card.explanation.map((line, i) => (
              <li key={i} className="text-lg lg:text-2xl text-slate-700 leading-relaxed">
                {line}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setShowQuiz(true)}
            className="w-full rounded-2xl bg-indigo-600 text-white text-lg lg:text-2xl font-extrabold py-4 lg:py-6 shadow-[0_5px_0_rgba(0,0,0,0.25)] active:shadow-none active:translate-y-1 transition-[transform,box-shadow]"
          >
            Le petit quiz ! 🧠
          </button>
        </>
      )}

      {showQuiz && (
        <>
          <p className="text-lg lg:text-2xl font-bold mb-4 lg:mb-6 text-center">{card.quiz.question}</p>
          <div className="flex flex-col gap-3 lg:gap-4">
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
                  className={`rounded-2xl py-4 px-4 lg:py-6 lg:px-6 text-lg lg:text-2xl font-bold text-left shadow-[0_4px_0_rgba(0,0,0,0.15)] enabled:active:shadow-none enabled:active:translate-y-1 transition-[transform,box-shadow] ${stateClasses}`}
                >
                  {choice}
                </button>
              );
            })}
          </div>
          {selected !== null && (
            <p className="text-center mt-4 lg:mt-6 text-lg lg:text-2xl font-bold">
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
