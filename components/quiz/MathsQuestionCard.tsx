"use client";

import { useState } from "react";
import { MathsQuestion, ThemeId } from "@/lib/types";
import { NUMBER_WORDS } from "@/lib/content/maths";
import { sfx } from "@/lib/sfx";
import { speak } from "@/lib/speech";
import Art from "../Art";
import MascotSays from "../ui/MascotSays";
import ChoiceTile, { TILE_COLORS } from "./ChoiceTile";
import { useAnswer } from "./useAnswer";

function objectSize(total: number) {
  if (total <= 5) return "w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24";
  if (total <= 10) return "w-12 h-12 sm:w-14 sm:h-14 lg:w-[4.5rem] lg:h-[4.5rem]";
  return "w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14";
}

export default function MathsQuestionCard({
  question,
  themeId,
  onSolved,
  onWrong,
}: {
  question: MathsQuestion;
  themeId: ThemeId;
  onSolved: (firstTry: boolean) => void;
  onWrong?: (attempt: number) => void;
}) {
  const { choose, tileState, mood } = useAnswer(question.answerIndex, onSolved, onWrong);
  const [counted, setCounted] = useState<Record<string, number>>({});

  const perGroup = question.kind === "compare";
  const totalObjects = question.groups.reduce((sum, g) => sum + g.count, 0);
  const size = objectSize(totalObjects);
  const removeCount = question.removeCount ?? 0;

  function tapObject(groupIndex: number, index: number) {
    const key = `${groupIndex}-${index}`;
    const existing = counted[key];
    if (existing) {
      speak(NUMBER_WORDS[existing] ?? String(existing));
      return;
    }
    const keys = Object.keys(counted);
    const n = perGroup ? keys.filter((k) => k.startsWith(`${groupIndex}-`)).length + 1 : keys.length + 1;
    setCounted({ ...counted, [key]: n });
    sfx.count();
    speak(NUMBER_WORDS[n] ?? String(n));
  }

  const groupOffsets = question.groups.map((_, gi) =>
    question.groups.slice(0, gi).reduce((sum, g) => sum + g.count, 0)
  );

  return (
    <div className="flex w-full max-w-5xl flex-col items-center gap-3 lg:gap-4">
      <MascotSays themeId={themeId} text={question.prompt} mood={mood} speakKey={question.id} />

      <div className="w-full rounded-[2rem] lg:rounded-[2.6rem] border-4 border-white/80 bg-white/95 px-4 py-4 sm:px-6 lg:py-5 shadow-[0_8px_0_rgba(0,0,0,0.08)] backdrop-blur-sm">
        {question.numberWord ? (
          <button
            type="button"
            onClick={() => speak(question.numberWord ?? "")}
            className="pop-in mx-auto block text-6xl sm:text-7xl lg:text-8xl font-bold capitalize text-violet-600"
            style={{ textShadow: "0 5px 0 rgba(0,0,0,0.12)" }}
          >
            {question.numberWord}
          </button>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
            {question.groups.map((group, gi) => (
              <div key={gi} className="flex items-center gap-4 sm:gap-8">
                {gi > 0 && (
                  <span className="text-5xl lg:text-7xl font-bold text-slate-400">
                    {question.kind === "add" ? "+" : "ou"}
                  </span>
                )}
                <div
                  className={`flex max-w-[34rem] flex-wrap justify-center gap-2 lg:gap-3 ${
                    perGroup ? "rounded-3xl bg-white/80 p-3 lg:p-4" : ""
                  }`}
                >
                  {Array.from({ length: group.count }, (_, i) => {
                    const removed = gi === question.groups.length - 1 && removeCount > 0 && i >= group.count - removeCount;
                    const badge = counted[`${gi}-${i}`];
                    const delay = (groupOffsets[gi] + i) * 70;
                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={removed}
                        onClick={() => tapObject(gi, i)}
                        aria-label={removed ? "parti" : "compter"}
                        className="pop-in relative rounded-2xl p-1 transition-transform enabled:active:scale-90"
                        style={{ animationDelay: `${delay}ms` }}
                      >
                        <Art name={group.art} className={`${size} ${removed ? "opacity-25 grayscale" : "float-y"}`} eager />
                        {removed && (
                          <span className="absolute inset-0 flex items-center justify-center text-5xl lg:text-7xl font-bold text-rose-500">
                            ✕
                          </span>
                        )}
                        {badge && (
                          <span className="pop-in absolute -top-1 -right-1 flex h-8 w-8 lg:h-11 lg:w-11 items-center justify-center rounded-full bg-amber-400 text-lg lg:text-2xl font-bold text-white shadow-[0_3px_0_#B45309]">
                            {badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        {!question.numberWord && (
          <p className="mt-3 text-center text-base lg:text-xl font-semibold text-slate-500">
            Touche les objets pour compter !
          </p>
        )}
      </div>

      <div className="grid w-full max-w-3xl grid-cols-3 gap-4 sm:gap-6">
        {question.choices.map((choice, i) => (
          <ChoiceTile
            key={i}
            state={tileState(i)}
            color={TILE_COLORS[i % TILE_COLORS.length]}
            onSelect={() => choose(i)}
            label={String(choice)}
          >
            <span className="text-6xl sm:text-7xl font-bold text-white" style={{ textShadow: "0 4px 0 rgba(0,0,0,0.2)" }}>
              {choice}
            </span>
          </ChoiceTile>
        ))}
      </div>
    </div>
  );
}
