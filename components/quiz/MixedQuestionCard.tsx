"use client";

import { AnyQuestion, ThemeId } from "@/lib/types";
import MathsQuestionCard from "./MathsQuestionCard";
import FrancaisQuestionCard from "./FrancaisQuestionCard";

export default function MixedQuestionCard({
  item,
  themeId,
  onSolved,
  onWrong,
}: {
  item: AnyQuestion;
  themeId: ThemeId;
  onSolved: (firstTry: boolean) => void;
  onWrong?: (attempt: number) => void;
}) {
  return item.subject === "maths" ? (
    <MathsQuestionCard key={item.question.id} question={item.question} themeId={themeId} onSolved={onSolved} onWrong={onWrong} />
  ) : (
    <FrancaisQuestionCard key={item.question.id} question={item.question} themeId={themeId} onSolved={onSolved} onWrong={onWrong} />
  );
}
