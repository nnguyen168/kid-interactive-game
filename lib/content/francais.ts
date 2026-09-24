import { ArtKey } from "../art";
import { FrancaisKind, FrancaisQuestion, Level, Theme, ThemeId } from "../types";
import { pick, shuffle, uid } from "../random";

type VocabEntry = {
  word: string; // with article, e.g. "le chat"
  spelling: string; // correctly accented, e.g. "château"
  art: ArtKey;
  letter: string;
};

const THEME_VOCAB: Record<ThemeId, VocabEntry[]> = {
  chevalier: [
    { word: "le château", spelling: "château", art: "castle", letter: "C" },
    { word: "le bouclier", spelling: "bouclier", art: "shield", letter: "B" },
    { word: "le dragon", spelling: "dragon", art: "dragon", letter: "D" },
    { word: "la couronne", spelling: "couronne", art: "crown", letter: "C" },
    { word: "le cheval", spelling: "cheval", art: "horse", letter: "C" },
  ],
  pompier: [
    { word: "le camion", spelling: "camion", art: "fire-engine", letter: "C" },
    { word: "le casque", spelling: "casque", art: "helmet", letter: "C" },
    { word: "le feu", spelling: "feu", art: "fire", letter: "F" },
    { word: "l'échelle", spelling: "échelle", art: "ladder", letter: "É" },
    { word: "la sirène", spelling: "sirène", art: "siren", letter: "S" },
  ],
  foot: [
    { word: "le ballon", spelling: "ballon", art: "ball", letter: "B" },
    { word: "le maillot", spelling: "maillot", art: "tshirt", letter: "M" },
    { word: "le but", spelling: "but", art: "goal", letter: "B" },
    { word: "le trophée", spelling: "trophée", art: "trophy", letter: "T" },
    { word: "le stade", spelling: "stade", art: "stadium", letter: "S" },
  ],
};

const GENERIC_VOCAB: VocabEntry[] = [
  { word: "le chat", spelling: "chat", art: "cat", letter: "C" },
  { word: "le chien", spelling: "chien", art: "dog", letter: "C" },
  { word: "la maison", spelling: "maison", art: "house", letter: "M" },
  { word: "le soleil", spelling: "soleil", art: "sun", letter: "S" },
  { word: "la lune", spelling: "lune", art: "moon", letter: "L" },
  { word: "la pomme", spelling: "pomme", art: "apple", letter: "P" },
  { word: "le poisson", spelling: "poisson", art: "fish", letter: "P" },
  { word: "la fleur", spelling: "fleur", art: "flower", letter: "F" },
  { word: "le livre", spelling: "livre", art: "book", letter: "L" },
  { word: "l'oiseau", spelling: "oiseau", art: "bird", letter: "O" },
];

const KINDS_BY_LEVEL: Record<Level, FrancaisKind[]> = {
  1: ["letter", "letter", "word-picture"],
  2: ["word-picture", "word-picture", "letter"],
  3: ["missing-letter", "missing-letter", "word-picture"],
};

const LETTER_POOL = "abcdefgilmnoprstuv".split("");

function pickWeightedVocab(theme: Theme): VocabEntry {
  return Math.random() < 0.65 ? pick(THEME_VOCAB[theme.id]) : pick(GENERIC_VOCAB);
}

function combinedPool(theme: Theme): VocabEntry[] {
  return [...THEME_VOCAB[theme.id], ...GENERIC_VOCAB];
}

function toChoice(v: VocabEntry) {
  return { label: v.spelling, art: v.art, speak: v.word };
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
      prompt: `Quelle image commence par la lettre ${target.letter} ?`,
      display: target.letter,
      speak: `Quelle image commence par la lettre ${target.letter} ?`,
      choices: options.map(toChoice),
      answerIndex: options.indexOf(target),
    };
  }

  if (kind === "word-picture") {
    const target = pickWeightedVocab(theme);
    const distractors = shuffle(pool.filter((v) => v.spelling !== target.spelling)).slice(0, 2);
    const options = shuffle([target, ...distractors]);
    return {
      id: uid(),
      kind,
      prompt: "Quelle image va avec ce mot ?",
      display: target.word,
      speak: `Quelle image va avec le mot : ${target.word} ?`,
      choices: options.map(toChoice),
      answerIndex: options.indexOf(target),
    };
  }

  // missing-letter: blank out a plain a-z letter so accents stay visible.
  const target = pick(pool.filter((v) => v.spelling.length >= 3));
  const letters = target.spelling.split("");
  const blankable = letters
    .map((ch, i) => (/[a-z]/.test(ch) ? i : -1))
    .filter((i) => i >= 0);
  const blankIndex = pick(blankable);
  const correctLetter = letters[blankIndex];
  const display = letters.map((ch, i) => (i === blankIndex ? "_" : ch)).join("");
  const letterDistractors = shuffle(LETTER_POOL.filter((l) => l !== correctLetter)).slice(0, 2);
  const letterOptions = shuffle([correctLetter, ...letterDistractors]);
  return {
    id: uid(),
    kind,
    prompt: "Quelle lettre manque ?",
    display,
    displayArt: target.art,
    speak: `Quelle lettre manque dans le mot : ${target.word} ?`,
    choices: letterOptions.map((l) => ({ label: l, speak: l })),
    answerIndex: letterOptions.indexOf(correctLetter),
  };
}
