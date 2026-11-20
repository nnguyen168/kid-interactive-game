"use client";

import { useEffect, useRef, useState } from "react";
import { RevisionQuestion } from "@/lib/content/revision";
import { THEMES } from "@/lib/themes";
import { ThemeId } from "@/lib/types";
import { speak } from "@/lib/speech";
import MascotSays from "../ui/MascotSays";
import ChoiceTile, { choiceGrid, TILE_COLORS } from "./ChoiceTile";
import { RevisionPicture } from "./RevisionVisuals";
import { useAnswer } from "./useAnswer";

/**
 * One révision question. After a wrong answer a helper appears (pictures or a
 * number line) with a spoken tip, so a mistake turns into a mini-lesson.
 */
export default function RevisionQuestionCard({
  question,
  themeId,
  onSolved,
}: {
  question: RevisionQuestion;
  themeId: ThemeId;
  onSolved: (firstTry: boolean) => void;
}) {
  const [help, setHelp] = useState(false);
  const tipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { choose, tileState, mood, solved } = useAnswer(question.answerIndex, onSolved, () => {
    if (!question.helper || help) return;
    setHelp(true);
    const tip = question.helper.tip;
    tipTimer.current = setTimeout(() => speak(tip), 1300);
  });
  useEffect(() => {
    // Handy for automated checks in development.
    if (process.env.NODE_ENV !== "production") Object.assign(window, { __revision: { answer: question.choices[question.answerIndex], step: question.step } });
  }, [question]);
  useEffect(
    () => () => {
      if (tipTimer.current) clearTimeout(tipTimer.current);
    },
    [],
  );

  const color = THEMES[themeId].colors.primary;
  const answer = question.choices[question.answerIndex];
  const equation = question.equation && solved ? question.equation.replace("?", String(answer)) : question.equation;

  return (
    <div className="flex w-full max-w-5xl flex-col items-center gap-3 lg:gap-4">
      <MascotSays themeId={themeId} text={question.prompt} mood={mood} speakKey={question.id} />

      <div className="flex w-full flex-col items-center gap-3 rounded-[2rem] border-4 border-white/80 bg-white/95 px-3 py-4 shadow-[0_8px_0_rgba(0,0,0,0.08)] backdrop-blur-sm sm:px-6 lg:rounded-[2.6rem] lg:py-5">
        {question.visual && <RevisionPicture visual={question.visual} color={color} showEnd={solved} />}
        {equation && (
          <button
            type="button"
            onClick={() => speak(question.prompt)}
            className={`pop-in whitespace-nowrap text-5xl font-bold sm:text-7xl lg:text-8xl ${solved ? "text-green-600" : "text-violet-600"}`}
            style={{ textShadow: "0 5px 0 rgba(0,0,0,0.12)" }}
          >
            {equation}
          </button>
        )}
        {help && question.helper && (
          <div className="rise-in flex w-full flex-col items-center gap-2 rounded-3xl bg-amber-50 px-3 py-3 ring-4 ring-amber-200">
            <button
              type="button"
              onClick={() => speak(question.helper?.tip ?? "")}
              className="text-center text-lg font-bold text-amber-800 sm:text-xl lg:text-2xl"
            >
              💡 {question.helper.tip}
            </button>
            <RevisionPicture visual={question.helper.visual} color={color} showEnd={solved} small />
          </div>
        )}
      </div>

      <div className={choiceGrid(question.choices.length)}>
        {question.choices.map((choice, i) => (
          <ChoiceTile key={i} state={tileState(i)} color={TILE_COLORS[i % TILE_COLORS.length]} onSelect={() => choose(i)} label={String(choice)}>
            <span className="text-6xl font-bold text-white sm:text-7xl" style={{ textShadow: "0 4px 0 rgba(0,0,0,0.2)" }}>
              {choice}
            </span>
          </ChoiceTile>
        ))}
      </div>
    </div>
  );
}
