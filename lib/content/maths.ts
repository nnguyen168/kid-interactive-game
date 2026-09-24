import { Level, MathsKind, MathsQuestion, Theme } from "../types";
import { pick, randomInt, shuffle, uid } from "../random";
import { remember } from "./recent";

const UNITS = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix"];
const TEENS = ["onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
const TENS: Record<number, string> = { 2: "vingt", 3: "trente", 4: "quarante", 5: "cinquante", 6: "soixante" };

/** French number words from 0 to 69 ("vingt et un", "trente-deux", ...). */
export function numberWord(n: number): string {
  if (n <= 10) return UNITS[n];
  if (n < 20) return TEENS[n - 11];
  const tens = Math.floor(n / 10);
  const unit = n % 10;
  if (unit === 0) return TENS[tens];
  if (unit === 1) return `${TENS[tens]} et un`;
  return `${TENS[tens]}-${UNITS[unit]}`;
}

export const NUMBER_WORDS: Record<number, string> = Object.fromEntries(
  Array.from({ length: 70 }, (_, n) => [n, numberWord(n)]),
);

const KINDS_BY_LEVEL: Record<Level, MathsKind[]> = {
  1: ["count", "count", "numeral", "add", "next", "compare"],
  2: ["add-written", "add-written", "subtract", "make-ten", "numeral", "sequence", "compare-numbers", "story"],
  3: ["add-written", "subtract-written", "subtract-written", "double", "sequence", "compare-numbers", "story", "make-ten"],
};

/** Number of answer tiles: three for beginners, four once they get stronger. */
const CHOICES_BY_LEVEL: Record<Level, number> = { 1: 3, 2: 4, 3: 4 };

/** Wrong answers close to the right one, so guessing does not work. */
function buildChoices(target: number, count: number, min = 0, max = target + 6): number[] {
  const near = shuffle(
    [-1, 1, -2, 2, -3, 3, 10, -10].map((d) => target + d).filter((n) => n >= min && n <= max && n !== target),
  );
  const set = new Set<number>([target]);
  for (const n of near) {
    if (set.size >= count) break;
    set.add(n);
  }
  for (let n = min; set.size < count && n <= max + count; n++) set.add(n);
  return shuffle([...set]);
}

function question(q: Omit<MathsQuestion, "id" | "answerIndex">, answer: number): MathsQuestion {
  return { ...q, id: uid(), answerIndex: q.choices.indexOf(answer) };
}

function generateOnce(theme: Theme, level: Level): MathsQuestion {
  const kind = pick(KINDS_BY_LEVEL[level]);
  const n = CHOICES_BY_LEVEL[level];
  const item = pick(theme.items);

  switch (kind) {
    case "count": {
      const value = randomInt(level === 1 ? 3 : 6, level === 1 ? 10 : 15);
      return question(
        { kind, prompt: `Combien y a-t-il de ${item.plural} ?`, groups: [{ art: item.art, count: value }], choices: buildChoices(value, n, 1) },
        value,
      );
    }
    case "numeral": {
      const value = level === 1 ? randomInt(0, 10) : randomInt(11, level === 2 ? 20 : 39);
      return question(
        { kind, prompt: "Quel est ce nombre ?", numberWord: numberWord(value), groups: [], choices: buildChoices(value, n) },
        value,
      );
    }
    case "add": {
      const a = randomInt(1, 6);
      const b = randomInt(1, 10 - a);
      return question(
        {
          kind,
          prompt: "Combien cela fait-il en tout ?",
          groups: [
            { art: item.art, count: a },
            { art: item.art, count: b },
          ],
          choices: buildChoices(a + b, n, 1),
        },
        a + b,
      );
    }
    case "next": {
      const start = randomInt(1, 16);
      const answer = start + 3;
      return question(
        {
          kind,
          prompt: "Quel nombre vient ensuite ?",
          display: `${start}, ${start + 1}, ${start + 2}, ?`,
          groups: [],
          choices: buildChoices(answer, n, 0),
        },
        answer,
      );
    }
    case "compare": {
      const other = pick(theme.items.filter((i) => i.art !== item.art)) ?? item;
      const a = randomInt(3, 10);
      let b = randomInt(3, 10);
      while (Math.abs(a - b) < 1) b = randomInt(3, 10);
      const target = Math.max(a, b);
      const choices = shuffle([a, b, ...buildChoices(target, 4, 1).filter((c) => c !== a && c !== b)].slice(0, n));
      return question(
        {
          kind,
          prompt: "Compte chaque groupe. Quel nombre est le plus grand ?",
          groups: [
            { art: item.art, count: a },
            { art: other.art, count: b },
          ],
          choices,
        },
        target,
      );
    }
    case "add-written": {
      const max = level === 2 ? 10 : 20;
      const a = randomInt(2, max - 2);
      const b = randomInt(1, max - a);
      return question(
        { kind, prompt: `Combien font ${a} plus ${b} ?`, display: `${a} + ${b} = ?`, groups: [], choices: buildChoices(a + b, n) },
        a + b,
      );
    }
    case "subtract": {
      const start = randomInt(4, 10);
      const removeCount = randomInt(1, start - 1);
      return question(
        {
          kind,
          prompt: `Il y avait ${start} ${item.plural}. ${removeCount} ${removeCount === 1 ? "s'en va" : "s'en vont"}. Combien en reste-t-il ?`,
          groups: [{ art: item.art, count: start }],
          removeCount,
          choices: buildChoices(start - removeCount, n),
        },
        start - removeCount,
      );
    }
    case "subtract-written": {
      const a = randomInt(8, 20);
      const b = randomInt(2, Math.min(9, a - 1));
      return question(
        { kind, prompt: `Combien font ${a} moins ${b} ?`, display: `${a} − ${b} = ?`, groups: [], choices: buildChoices(a - b, n) },
        a - b,
      );
    }
    case "make-ten": {
      const total = level === 3 && Math.random() < 0.5 ? 20 : 10;
      const a = randomInt(total === 10 ? 1 : 11, total - 1);
      const answer = total - a;
      return question(
        {
          kind,
          prompt: `Combien faut-il ajouter à ${a} pour faire ${total} ?`,
          display: `${a} + ? = ${total}`,
          groups: [],
          choices: buildChoices(answer, n),
        },
        answer,
      );
    }
    case "double": {
      const a = randomInt(2, 10);
      return question(
        { kind, prompt: `Quel est le double de ${a} ?`, display: `${a} + ${a} = ?`, groups: [], choices: buildChoices(a * 2, n) },
        a * 2,
      );
    }
    case "sequence": {
      const step = level === 3 ? pick([2, 2, -1, 10]) : 1;
      const len = 5;
      const start = step > 0 ? randomInt(level === 2 ? 5 : 10, level === 2 ? 25 : 40) : randomInt(12, 30);
      const values = Array.from({ length: len }, (_, i) => start + i * step);
      const hole = randomInt(1, len - 2);
      const display = values.map((v, i) => (i === hole ? "?" : String(v))).join(", ");
      const prompt =
        step === 2 ? "On compte de 2 en 2. Quel nombre manque ?" : step === 10 ? "On compte de 10 en 10. Quel nombre manque ?" : step < 0 ? "On compte à l'envers. Quel nombre manque ?" : "Quel nombre manque ?";
      return question({ kind, prompt, display, groups: [], choices: buildChoices(values[hole], n) }, values[hole]);
    }
    case "compare-numbers": {
      const max = level === 2 ? 20 : 60;
      const base = randomInt(10, max - 9);
      // Tricky pairs such as 16 and 61, or 29 and 31.
      const pool = shuffle([base, base + randomInt(1, 9), Number(String(base).split("").reverse().join("")), base - randomInt(1, 8)])
        .filter((v, i, arr) => v > 0 && v <= 99 && arr.indexOf(v) === i)
        .slice(0, n);
      while (pool.length < n) pool.push(pool.length + base + 11);
      const smallest = Math.random() < 0.3;
      const answer = smallest ? Math.min(...pool) : Math.max(...pool);
      return question(
        {
          kind,
          prompt: smallest ? "Quel est le plus petit nombre ?" : "Quel est le plus grand nombre ?",
          display: smallest ? "le plus petit ?" : "le plus grand ?",
          groups: [],
          choices: pool,
        },
        answer,
      );
    }
    case "story":
    default: {
      const max = level === 2 ? 10 : 20;
      const give = Math.random() < 0.5;
      if (give) {
        const start = randomInt(5, max);
        const lost = randomInt(1, start - 1);
        const verb = pick(["en donne", "en perd", "en range"]);
        return question(
          {
            kind: "story",
            prompt: `Loukas a ${start} ${item.plural}. Il ${verb} ${lost}. Combien lui en reste-t-il ?`,
            display: `${start} − ${lost} = ?`,
            groups: [],
            choices: buildChoices(start - lost, n),
          },
          start - lost,
        );
      }
      const a = randomInt(2, max - 3);
      const b = randomInt(1, Math.min(9, max - a));
      const verb = pick(["en trouve", "en gagne", "en reçoit"]);
      return question(
        {
          kind: "story",
          prompt: `Loukas a ${a} ${item.plural}. Il ${verb} ${b} de plus. Combien en a-t-il maintenant ?`,
          display: `${a} + ${b} = ?`,
          groups: [],
          choices: buildChoices(a + b, n),
        },
        a + b,
      );
    }
  }
}

export function generateMathsQuestion(theme: Theme, level: Level): MathsQuestion {
  return remember(
    () => generateOnce(theme, level),
    (q) => `${q.kind}|${q.prompt}|${q.display ?? ""}|${q.numberWord ?? ""}|${q.groups.map((g) => g.count).join(",")}|${[...q.choices].sort().join(",")}`,
  );
}
