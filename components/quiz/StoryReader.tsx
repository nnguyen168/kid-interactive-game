"use client";

import { useState } from "react";
import { DecouverteCard, ThemeId } from "@/lib/types";
import { THEMES } from "@/lib/themes";
import { sfx } from "@/lib/sfx";
import { speak } from "@/lib/speech";
import { frenchSpaces } from "@/lib/text";
import Art from "../Art";
import MascotSays from "../ui/MascotSays";
import CandyButton from "../ui/CandyButton";
import IconButton from "../ui/IconButton";
import { ArrowIcon } from "../ui/icons";
import ChoiceTile, { TILE_COLORS } from "./ChoiceTile";
import { useAnswer } from "./useAnswer";

function StoryQuiz({
  card,
  themeId,
  onFinish,
}: {
  card: DecouverteCard;
  themeId: ThemeId;
  onFinish: (firstTry: boolean) => void;
}) {
  const { choose, tileState, mood } = useAnswer(card.quiz.answerIndex, onFinish);
  const spoken = `${card.quiz.question} ${card.quiz.choices.join(", ou bien, ")} ?`;
  return (
    <div className="flex w-full max-w-5xl flex-col items-center gap-4 lg:gap-8">
      <MascotSays themeId={themeId} text={card.quiz.question} speakText={spoken} mood={mood} speakKey={`${card.id}-quiz`} />
      <div className="grid w-full max-w-5xl gap-5 sm:grid-cols-3 lg:gap-8">
        {card.quiz.choices.map((choice, i) => (
          <ChoiceTile
            key={i}
            wide
            state={tileState(i)}
            color={TILE_COLORS[i % TILE_COLORS.length]}
            onSelect={() => choose(i)}
            onSpeak={() => speak(choice)}
            label={choice}
          >
            <span className="text-2xl lg:text-3xl font-bold leading-tight text-white" style={{ textShadow: "0 3px 0 rgba(0,0,0,0.2)" }}>
              {choice}
            </span>
          </ChoiceTile>
        ))}
      </div>
    </div>
  );
}

/** A picture-book: one narrated sentence per page, then a small spoken quiz. */
export default function StoryReader({
  card,
  themeId,
  onFinish,
}: {
  card: DecouverteCard;
  themeId: ThemeId;
  onFinish: (firstTry: boolean) => void;
}) {
  const [page, setPage] = useState(0);
  const [quiz, setQuiz] = useState(false);
  const color = THEMES[themeId].colors.primary;
  const total = card.explanation.length;

  if (quiz) return <StoryQuiz card={card} themeId={themeId} onFinish={onFinish} />;

  function next() {
    sfx.whoosh();
    if (page + 1 < total) setPage(page + 1);
    else setQuiz(true);
  }

  return (
    <div className="flex w-full max-w-5xl flex-col items-center gap-3 lg:gap-5">
      <div className="w-full rounded-[2.4rem] border-4 border-white/80 bg-white/95 px-4 py-4 shadow-[0_8px_0_rgba(0,0,0,0.08)] backdrop-blur-sm lg:py-6">
        <h2 className="text-center text-2xl font-bold text-slate-800 sm:text-3xl lg:text-5xl">{frenchSpaces(card.question)}</h2>
        <div className="relative mx-auto flex h-36 max-w-xl items-center justify-center sm:h-48 lg:h-64">
          <Art name={card.art[0]} className="float-y w-32 h-32 sm:w-44 sm:h-44 lg:w-56 lg:h-56" eager />
          <span className="float-y absolute right-[8%] top-0" style={{ animationDelay: "-1.5s" }}>
            <Art name={card.art[1]} className="w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32" eager />
          </span>
        </div>
        <div className="flex justify-center gap-2">
          {card.explanation.map((_, i) => (
            <span key={i} className={`h-3 rounded-full transition-all lg:h-4 ${i === page ? "w-10 lg:w-14" : "w-3 lg:w-4"}`} style={{ background: i <= page ? color : "#CBD5E1" }} />
          ))}
        </div>
      </div>

      <MascotSays
        themeId={themeId}
        text={card.explanation[page]}
        speakText={page === 0 ? `${card.question} ${card.explanation[0]}` : undefined}
        speakKey={`${card.id}-${page}`}
      />

      <div className="flex items-center gap-4">
        {page > 0 && (
          <IconButton label="Page précédente" onClick={() => setPage(page - 1)}>
            <ArrowIcon back className="w-8 h-8 text-slate-600 lg:w-10 lg:h-10" />
          </IconButton>
        )}
        <CandyButton color={color} size="xl" onClick={next} iconRight={<ArrowIcon className="w-9 h-9 lg:w-12 lg:h-12" />}>
          {page + 1 < total ? "La suite" : "Le quiz !"}
        </CandyButton>
      </div>
    </div>
  );
}
