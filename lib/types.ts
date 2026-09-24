import { ArtKey } from "./art";

export type ThemeId = "chevalier" | "pompier" | "foot" | "course";

export type ThemeItem = {
  art: ArtKey;
  singular: string;
  plural: string;
};

export type Theme = {
  id: ThemeId;
  name: string;
  mascotName: string;
  greeting: string;
  iconArt: ArtKey;
  colors: {
    primary: string;
    secondary: string;
    soft: string;
    text: string;
  };
  sky: { top: string; bottom: string };
  items: ThemeItem[];
  badgeName: string;
  badgeArt: ArtKey;
  challenge: { mover: ArtKey; target: ArtKey; win: string };
};

export type Subject = "maths" | "francais";

export type Level = 1 | 2 | 3;

export type MathsKind =
  | "count"
  | "numeral"
  | "add"
  | "next"
  | "compare"
  | "add-written"
  | "subtract"
  | "subtract-written"
  | "make-ten"
  | "double"
  | "sequence"
  | "compare-numbers"
  | "story";

export type MathsQuestion = {
  id: string;
  kind: MathsKind;
  prompt: string;
  groups: { art: ArtKey; count: number }[];
  removeCount?: number;
  numberWord?: string;
  /** Big written line such as "7 + 5 = ?" or "12, 13, ?, 15". */
  display?: string;
  choices: number[];
  answerIndex: number;
};

export type FrancaisKind =
  | "letter"
  | "word-picture"
  | "picture-word"
  | "missing-letter"
  | "missing-syllable"
  | "case"
  | "alphabet"
  | "syllables"
  | "sound"
  | "first-syllable"
  | "rhyme";

/** How the question is shown above the answers. */
export type FrancaisStage = "letter" | "word" | "blank" | "art";

export type FrancaisChoice = {
  label: string;
  art?: ArtKey;
  speak?: string;
};

export type FrancaisQuestion = {
  id: string;
  kind: FrancaisKind;
  stage: FrancaisStage;
  prompt: string;
  display: string;
  displayArt?: ArtKey;
  choices: FrancaisChoice[];
  answerIndex: number;
  speak: string;
};

export type DecouverteCard = {
  id: string;
  title: string;
  question: string;
  art: [ArtKey, ArtKey];
  explanation: string[];
  quiz: {
    question: string;
    choices: string[];
    answerIndex: number;
  };
};

export type AnyQuestion =
  | { subject: "maths"; question: MathsQuestion }
  | { subject: "francais"; question: FrancaisQuestion };
