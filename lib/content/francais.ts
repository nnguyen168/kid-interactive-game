import { FrancaisKind, FrancaisQuestion, Level, Theme, ThemeId } from "../types";
import { pick, randomInt, shuffle, uid } from "../random";

type VocabEntry = {
  word: string; // with article, e.g. "le chat"
  bare: string; // lowercase, no article, no accents-safe letters kept as-is
  display?: string; // accented display form if different from bare
  emoji: string;
  letter: string;
};

const THEME_VOCAB: Record<ThemeId, VocabEntry[]> = {
  chevalier: [
    { word: "le château", bare: "chateau", display: "château", emoji: "🏰", letter: "C" },
    { word: "le bouclier", bare: "bouclier", emoji: "🛡️", letter: "B" },
    { word: "le dragon", bare: "dragon", emoji: "🐉", letter: "D" },
    { word: "la couronne", bare: "couronne", emoji: "👑", letter: "C" },
    { word: "le cheval", bare: "cheval", emoji: "🐴", letter: "C" },
  ],
  pompier: [
    { word: "le camion", bare: "camion", emoji: "🚒", letter: "C" },
    { word: "le casque", bare: "casque", emoji: "🪖", letter: "C" },
    { word: "le feu", bare: "feu", emoji: "🔥", letter: "F" },
    { word: "l'eau", bare: "eau", emoji: "💧", letter: "E" },
    { word: "la sirène", bare: "sirene", display: "sirène", emoji: "🚨", letter: "S" },
  ],
  foot: [
    { word: "le ballon", bare: "ballon", emoji: "⚽", letter: "B" },
    { word: "le maillot", bare: "maillot", emoji: "👕", letter: "M" },
    { word: "le but", bare: "but", emoji: "🥅", letter: "B" },
    { word: "le trophée", bare: "trophee", display: "trophée", emoji: "🏆", letter: "T" },
    { word: "le stade", bare: "stade", emoji: "🏟️", letter: "S" },
  ],
};

const GENERIC_VOCAB: VocabEntry[] = [
  { word: "le chat", bare: "chat", emoji: "🐱", letter: "C" },
  { word: "le chien", bare: "chien", emoji: "🐶", letter: "C" },
  { word: "la maison", bare: "maison", emoji: "🏠", letter: "M" },
  { word: "le soleil", bare: "soleil", emoji: "☀️", letter: "S" },
  { word: "la lune", bare: "lune", emoji: "🌙", letter: "L" },
  { word: "la pomme", bare: "pomme", emoji: "🍎", letter: "P" },
  { word: "le poisson", bare: "poisson", emoji: "🐟", letter: "P" },
  { word: "la fleur", bare: "fleur", emoji: "🌸", letter: "F" },
  { word: "le livre", bare: "livre", emoji: "📖", letter: "L" },
  { word: "l'oiseau", bare: "oiseau", emoji: "🐦", letter: "O" },
];

const KINDS_BY_LEVEL: Record<Level, FrancaisKind[]> = {
  1: ["letter", "letter", "word-picture"],
  2: ["word-picture", "word-picture", "letter"],
  3: ["missing-letter", "missing-letter", "word-picture"],
};

const LETTER_POOL = "abcdefgilmnoprstuv".split("");

function pickWeightedVocab(theme: Theme): VocabEntry {
  const themeVocab = THEME_VOCAB[theme.id];
  return Math.random() < 0.65 ? pick(themeVocab) : pick(GENERIC_VOCAB);
}

function combinedPool(theme: Theme): VocabEntry[] {
  return [...THEME_VOCAB[theme.id], ...GENERIC_VOCAB];
}

export function generateFrancaisQuestion(theme: Theme, level: Level): FrancaisQuestion {
  const kind = pick(KINDS_BY_LEVEL[level]);
  const pool = combinedPool(theme);

  if (kind === "letter") {
    const target = pickWeightedVocab(theme);
    const distractors = shuffle(pool.filter((v) => v.letter !== target.letter)).slice(0, 2);
    const options = shuffle([target, ...distractors]);
    return {
      id: uid(),
      kind,
      prompt: `Quelle image commence par la lettre "${target.letter}" ?`,
      display: target.letter,
      speak: `Quelle image commence par la lettre ${target.letter} ?`,
      choices: options.map((v) => ({ label: v.display ?? v.bare, emoji: v.emoji })),
      answerIndex: options.indexOf(target),
    };
  }

  if (kind === "word-picture") {
    const target = pickWeightedVocab(theme);
    const distractors = shuffle(pool.filter((v) => v.bare !== target.bare)).slice(0, 2);
    const options = shuffle([target, ...distractors]);
    return {
      id: uid(),
      kind,
      prompt: "Quelle image correspond au mot ?",
      display: target.word,
      speak: target.word,
      choices: options.map((v) => ({ label: v.display ?? v.bare, emoji: v.emoji })),
      answerIndex: options.indexOf(target),
    };
  }

  // missing-letter
  const candidates = pool.filter((v) => v.bare.length >= 3);
  const target = pick(candidates.length > 0 ? candidates : pool);
  const bare = target.bare;
  const blankIndex = randomInt(0, bare.length - 1);
  const correctLetter = bare[blankIndex];
  const display = bare
    .split("")
    .map((ch, i) => (i === blankIndex ? "_" : ch))
    .join("");
  const letterDistractors = shuffle(LETTER_POOL.filter((l) => l !== correctLetter)).slice(0, 2);
  const letterOptions = shuffle([correctLetter, ...letterDistractors]);
  return {
    id: uid(),
    kind,
    prompt: "Complète le mot : quelle lettre manque ?",
    display,
    displayEmoji: target.emoji,
    speak: target.display ?? target.bare,
    choices: letterOptions.map((l) => ({ label: l })),
    answerIndex: letterOptions.indexOf(correctLetter),
  };
}
