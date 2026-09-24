import { Level, MathsKind, MathsQuestion, Theme } from "../types";
import { pick, randomInt, shuffle, uid } from "../random";

const NUMBER_WORDS: Record<number, string> = {
  0: "zéro",
  1: "un",
  2: "deux",
  3: "trois",
  4: "quatre",
  5: "cinq",
  6: "six",
  7: "sept",
  8: "huit",
  9: "neuf",
  10: "dix",
};

const KINDS_BY_LEVEL: Record<Level, MathsKind[]> = {
  1: ["count", "count", "numeral"],
  2: ["count", "add", "compare"],
  3: ["add", "subtract", "compare"],
};

const RANGE_BY_LEVEL: Record<Level, [number, number]> = {
  1: [1, 5],
  2: [1, 10],
  3: [1, 10],
};

function buildChoices(target: number, min: number, max: number, count = 3): number[] {
  const set = new Set<number>([target]);
  const pool = shuffle(
    Array.from({ length: max - min + 1 }, (_, i) => min + i).filter((n) => n !== target)
  );
  for (const n of pool) {
    if (set.size >= count) break;
    set.add(n);
  }
  return shuffle(Array.from(set));
}

export function generateMathsQuestion(theme: Theme, level: Level): MathsQuestion {
  const kind = pick(KINDS_BY_LEVEL[level]);
  const [min, max] = RANGE_BY_LEVEL[level];

  if (kind === "numeral") {
    const value = randomInt(min, max);
    const choices = buildChoices(value, 0, max + 2);
    return {
      id: uid(),
      kind,
      prompt: "Quel est ce nombre ?",
      numberWord: NUMBER_WORDS[value] ?? String(value),
      groups: [],
      choices,
      answerIndex: choices.indexOf(value),
    };
  }

  if (kind === "count") {
    const item = pick(theme.items);
    const value = randomInt(min, max);
    const choices = buildChoices(value, 0, max + 2);
    return {
      id: uid(),
      kind,
      prompt: `Combien y a-t-il de ${item.plural} ?`,
      groups: [{ emoji: item.emoji, count: value }],
      choices,
      answerIndex: choices.indexOf(value),
    };
  }

  if (kind === "add") {
    const item = pick(theme.items);
    const a = randomInt(1, Math.max(2, Math.ceil(max / 2)));
    let b = randomInt(1, Math.max(2, Math.ceil(max / 2)));
    while (a + b > max) {
      b = Math.max(1, b - 1);
    }
    const sum = a + b;
    const choices = buildChoices(sum, 0, max + 2);
    return {
      id: uid(),
      kind,
      prompt: "Combien cela fait-il en tout ?",
      groups: [
        { emoji: item.emoji, count: a },
        { emoji: item.emoji, count: b },
      ],
      choices,
      answerIndex: choices.indexOf(sum),
    };
  }

  if (kind === "subtract") {
    const item = pick(theme.items);
    const start = randomInt(3, max);
    const removeCount = randomInt(1, start);
    const result = start - removeCount;
    const choices = buildChoices(result, 0, max);
    return {
      id: uid(),
      kind,
      prompt: `Il y avait ${start} ${item.plural}. ${removeCount} s'en vont. Combien en reste-t-il ?`,
      groups: [{ emoji: item.emoji, count: start }],
      removeCount,
      choices,
      answerIndex: choices.indexOf(result),
    };
  }

  // compare
  const itemA = pick(theme.items);
  const itemB = pick(theme.items.filter((i) => i.emoji !== itemA.emoji)) ?? itemA;
  const a = randomInt(min, max);
  let b = randomInt(min, max);
  while (b === a) b = randomInt(min, max);
  const target = Math.max(a, b);
  const distractorPool = shuffle(
    Array.from({ length: max + 1 }, (_, i) => i).filter((n) => n !== a && n !== b)
  );
  const distractor = distractorPool[0] ?? Math.max(0, target - 3);
  const finalChoices = shuffle([a, b, distractor]);
  return {
    id: uid(),
    kind: "compare",
    prompt: "Quel nombre est le plus grand ?",
    groups: [
      { emoji: itemA.emoji, count: a },
      { emoji: itemB.emoji, count: b },
    ],
    choices: finalChoices,
    answerIndex: finalChoices.indexOf(target),
  };
}
