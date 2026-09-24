export type ThemeId = "chevalier" | "pompier" | "foot";

export type ThemeItem = {
  emoji: string;
  singular: string;
  plural: string;
};

export type Theme = {
  id: ThemeId;
  name: string;
  mascotName: string;
  mascotEmoji: string;
  tagline: string;
  colors: {
    primary: string;
    primaryDark: string;
    secondary: string;
    soft: string;
    text: string;
  };
  items: ThemeItem[];
  badgeName: string;
  badgeEmoji: string;
};

export type Subject = "maths" | "francais";

export type Level = 1 | 2 | 3;

export type MathsKind = "count" | "numeral" | "add" | "subtract" | "compare";

export type MathsQuestion = {
  id: string;
  kind: MathsKind;
  prompt: string;
  groups: { emoji: string; count: number }[];
  removeCount?: number;
  numberWord?: string;
  choices: number[];
  answerIndex: number;
};

export type FrancaisKind = "letter" | "word-picture" | "missing-letter";

export type FrancaisChoice = {
  label: string;
  emoji?: string;
};

export type FrancaisQuestion = {
  id: string;
  kind: FrancaisKind;
  prompt: string;
  display: string;
  displayEmoji?: string;
  choices: FrancaisChoice[];
  answerIndex: number;
  speak: string;
};

export type DecouverteCard = {
  id: string;
  title: string;
  question: string;
  emoji: string;
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
