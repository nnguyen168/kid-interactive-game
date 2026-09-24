"use client";

import { FrancaisQuestion, ThemeId } from "@/lib/types";
import { THEMES } from "@/lib/themes";
import { speak } from "@/lib/speech";
import Art from "../Art";
import MascotSays from "../ui/MascotSays";
import { candyStyle } from "../ui/CandyButton";
import ChoiceTile, { choiceGrid, TILE_COLORS } from "./ChoiceTile";
import { useAnswer } from "./useAnswer";

function Stage({ question, themeId, solved }: { question: FrancaisQuestion; themeId: ThemeId; solved: boolean }) {
  const color = THEMES[themeId].colors.primary;

  if (question.stage === "letter") {
    return (
      <button
        type="button"
        onClick={() => speak(question.speak)}
        className="pop-in mx-auto flex h-36 min-w-36 items-center justify-center rounded-[2.2rem] px-8 text-7xl font-bold text-white sm:h-44 sm:min-w-44 sm:text-8xl"
        style={{ ...candyStyle(color), textShadow: "0 5px 0 rgba(0,0,0,0.2)" }}
      >
        {question.display}
      </button>
    );
  }

  if (question.stage === "word") {
    return (
      <button
        type="button"
        onClick={() => speak(question.display)}
        className="pop-in mx-auto flex items-center gap-4 rounded-[2rem] bg-white px-8 py-5 shadow-[0_6px_0_rgba(0,0,0,0.1)] lg:px-12 lg:py-7"
      >
        <span className="text-5xl font-bold tracking-wide text-slate-800 sm:text-6xl lg:text-7xl">{question.display}</span>
        <Art name="speaker" className="w-10 h-10 lg:w-14 lg:h-14" eager />
      </button>
    );
  }

  if (question.stage === "art") {
    return (
      <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-8">
        {question.displayArt && <Art name={question.displayArt} className="pop-in float-y w-32 h-32 sm:w-40 sm:h-40" eager />}
        {question.display && (
          <button
            type="button"
            onClick={() => speak(question.display)}
            className="text-4xl font-bold text-slate-800 sm:text-5xl lg:text-6xl"
          >
            {question.display.replace(/^(le |la |les |l')/, "")}
          </button>
        )}
      </div>
    );
  }

  // "blank": a word with one missing letter or syllable.
  const answer = question.choices[question.answerIndex].label;
  const [before, after] = question.display.split("_");
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-8">
      {question.displayArt && <Art name={question.displayArt} className="pop-in float-y w-28 h-28 sm:w-36 sm:h-36 lg:w-36 lg:h-36" eager />}
      <div className="flex items-center gap-1 text-5xl font-bold text-slate-800 sm:gap-2 sm:text-6xl lg:text-7xl">
        <span>{before}</span>
        <span
          className={`flex h-16 min-w-14 items-center justify-center rounded-2xl px-2 sm:h-20 sm:min-w-16 lg:h-24 lg:min-w-20 ${
            solved ? "pop-in bg-green-500 text-white" : "border-4 border-dashed border-amber-400 bg-amber-50 text-amber-400"
          }`}
        >
          {solved ? answer : "?"}
        </span>
        <span>{after}</span>
      </div>
    </div>
  );
}

/** Font size that keeps longer answers (whole words) inside their tile. */
function labelSize(label: string) {
  if (label.length <= 2) return "text-6xl sm:text-7xl";
  if (label.length <= 5) return "text-4xl sm:text-5xl";
  if (label.length <= 8) return "text-3xl sm:text-4xl";
  return "text-2xl sm:text-3xl";
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

      <div className={choiceGrid(question.choices.length)}>
        {question.choices.map((choice, i) => (
          <ChoiceTile
            key={i}
            state={tileState(i)}
            color={pictureChoices ? "#FFFFFF" : TILE_COLORS[i % TILE_COLORS.length]}
            onSelect={() => choose(i)}
            onSpeak={pictureChoices && choice.speak ? () => speak(choice.speak ?? "") : undefined}
            label={choice.label}
          >
            {choice.art ? (
              <Art name={choice.art} className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28" eager />
            ) : (
              <span className={`${labelSize(choice.label)} px-1 font-bold text-white`} style={{ textShadow: "0 4px 0 rgba(0,0,0,0.2)" }}>
                {choice.label}
              </span>
            )}
          </ChoiceTile>
        ))}
      </div>
    </div>
  );
}
