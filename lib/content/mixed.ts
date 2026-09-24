import { AnyQuestion, Level, Subject, Theme } from "../types";
import { generateMathsQuestion } from "./maths";
import { generateFrancaisQuestion } from "./francais";
import { pick } from "../random";

export function generateMixedQuestion(
  theme: Theme,
  level: Record<Subject, Level>
): AnyQuestion {
  const subject = pick<Subject>(["maths", "francais"]);
  if (subject === "maths") {
    return { subject: "maths", question: generateMathsQuestion(theme, level.maths) };
  }
  return { subject: "francais", question: generateFrancaisQuestion(theme, level.francais) };
}
