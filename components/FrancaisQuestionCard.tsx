"use client";

import { useState } from "react";
import SpeakButton from "./SpeakButton";
import { FrancaisQuestion } from "@/lib/types";

export default function FrancaisQuestionCard({
  question,
  onAnswer,
}: {
  question: FrancaisQuestion;
  onAnswer: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  function handleSelect(i: number) {
    if (selected !== null) return;
    setSelected(i);
    onAnswer(i === question.answerIndex);
  }

  return (
    <div className="w-full max-w-lg mx-auto rounded-3xl bg-white p-6 shadow-xl">
      <div className="flex items-start gap-3 mb-2">
        <SpeakButton text={question.speak} />
        <p className="text-xl font-bold leading-snug flex-1 pt-2">{question.prompt}</p>
      </div>

      <div className="flex flex-col items-center gap-2 my-6">
        {question.displayEmoji && <div className="text-5xl">{question.displayEmoji}</div>}
        <div className="text-5xl font-black tracking-widest">{question.display}</div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4">
        {question.choices.map((choice, i) => {
          const isCorrect = i === question.answerIndex;
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
              className={`rounded-2xl py-5 text-3xl font-extrabold shadow active:scale-95 transition-transform ${stateClasses}`}
            >
              {choice.emoji ?? choice.label.toUpperCase()}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <p className="text-center mt-4 text-lg font-bold">
          {selected === question.answerIndex
            ? "🎉 Bravo !"
            : "😊 Pas tout à fait, réessaie la prochaine fois !"}
        </p>
      )}
    </div>
  );
}
