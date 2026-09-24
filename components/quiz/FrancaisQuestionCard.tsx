"use client";

import { FrancaisQuestion, ThemeId } from "@/lib/types";
import { THEMES } from "@/lib/themes";
import { speak } from "@/lib/speech";
import Art from "../Art";
import MascotSays from "../ui/MascotSays";
import { candyStyle } from "../ui/CandyButton";
import ChoiceTile, { TILE_COLORS } from "./ChoiceTile";
import { useAnswer } from "./useAnswer";

function Stage({ question, themeId, solved }: { question: FrancaisQuestion; themeId: ThemeId; solved: boolean }) {
  const color = THEMES[themeId].colors.primary;

  if (question.kind === "letter") {
    return (
      <button
        type="button"
        onClick={() => speak(question.display)}
        className="pop-in mx-auto flex h-36 w-36 sm:h-44 sm:w-44 lg:h-44 lg:w-44 items-center justify-center rounded-[2.2rem] text-8xl font-bold text-white"
        style={{ ...candyStyle(color), textShadow: "0 5px 0 rgba(0,0,0,0.2)" }}
      >
        {question.display}
      </button>
    );
  }

  if (question.kind === "word-picture") {
    return (
      <button
        type="button"
        onClick={() => speak(question.display)}
        className="pop-in mx-auto flex items-center gap-4 rounded-[2rem] bg-white px-8 py-5 lg:px-12 lg:py-7 shadow-[0_6px_0_rgba(0,0,0,0.1)]"
      >
        <span className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-wide text-slate-800">{question.display}</span>
        <Art name="speaker" className="w-10 h-10 lg:w-14 lg:h-14" eager />
      </button>
    );
  }

  const answer = question.choices[question.answerIndex].label;
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-8">
      {question.displayArt && <Art name={question.displayArt} className="pop-in float-y w-28 h-28 sm:w-36 sm:h-36 lg:w-36 lg:h-36" eager />}
      <div className="flex items-center gap-1 sm:gap-2">
        {question.display.split("").map((ch, i) =>
          ch === "_" ? (
            <span
              key={i}
              className={`flex h-16 w-14 sm:h-20 sm:w-16 lg:h-24 lg:w-20 items-center justify-center rounded-2xl text-5xl sm:text-6xl lg:text-7xl font-bold ${
                solved ? "pop-in bg-green-500 text-white" : "border-4 border-dashed border-amber-400 bg-amber-50 text-amber-400"
              }`}
            >
              {solved ? answer : "?"}
            </span>
          ) : (
            <span key={i} className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-800">
              {ch}
            </span>
          )
        )}
      </div>
    </div>
  );
}

export default function FrancaisQuestionCard({
  question,
  themeId,
  onSolved,
  onWrong,
}: {
  question: FrancaisQuestion;
  themeId: ThemeId;
  onSolved: (firstTry: boolean) => void;
  onWrong?: (attempt: number) => void;
}) {
  const { choose, tileState, mood, solved } = useAnswer(question.answerIndex, onSolved, onWrong);
  const pictureChoices = question.choices.some((c) => c.art);

  return (
    <div className="flex w-full max-w-5xl flex-col items-center gap-3 lg:gap-4">
      <MascotSays themeId={themeId} text={question.prompt} speakText={question.speak} mood={mood} speakKey={question.id} />

      <div className="w-full rounded-[2rem] lg:rounded-[2.6rem] border-4 border-white/80 bg-white/95 px-4 py-4 lg:py-5 shadow-[0_8px_0_rgba(0,0,0,0.08)] backdrop-blur-sm">
        <Stage question={question} themeId={themeId} solved={solved} />
      </div>

      <div className="grid w-full max-w-3xl grid-cols-3 gap-4 sm:gap-6">
        {question.choices.map((choice, i) => (
          <ChoiceTile
            key={i}
            state={tileState(i)}
            color={pictureChoices ? "#FFFFFF" : TILE_COLORS[i % TILE_COLORS.length]}
            onSelect={() => choose(i)}
            onSpeak={choice.speak ? () => speak(choice.speak ?? "") : undefined}
            label={choice.label}
          >
            {choice.art ? (
              <Art name={choice.art} className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28" eager />
            ) : (
              <span className="text-6xl sm:text-7xl font-bold text-white" style={{ textShadow: "0 4px 0 rgba(0,0,0,0.2)" }}>
                {choice.label}
              </span>
            )}
          </ChoiceTile>
        ))}
      </div>
    </div>
  );
}
