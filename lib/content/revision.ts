import { ArtKey } from "../art";
import { pick, randomInt, uid } from "../random";
import { Theme } from "../types";
import { buildChoices } from "./maths";
import { remember } from "./recent";

/**
 * Révision: a focused practice on one skill the child has not mastered yet at
 * school. Each topic is a ladder of small steps; the round climbs a step after
 * two right answers in a row and goes back one after two misses.
 */
export type RevisionTopicId = "soustraction" | "addition";

/** A picture of the sum: a group of objects, some crossed out (−) or a second group (+). */
export type PicturesVisual = { kind: "pictures"; art: ArtKey; a: number; b: number; op: Op };
/** Hops on a number line from one number to another. */
export type LineVisual = { kind: "line"; from: number; to: number; lo: number; hi: number; viaTen?: boolean };
export type RevisionVisual = PicturesVisual | LineVisual;

export type RevisionQuestion = {
  id: string;
  step: number;
  prompt: string;
  /** Big written line such as "7 − 3 = ?". */
  equation?: string;
  /** Shown from the start. */
  visual?: RevisionVisual;
  /** Shown after a wrong answer, with a spoken tip. */
  helper?: { visual: RevisionVisual; tip: string };
  choices: number[];
  answerIndex: number;
};

type Op = "-" | "+";
type Mode = "pictures" | "pictures-eq" | "line" | "written" | "story" | "missing" | "big" | "tens" | "bridge";

type Step = { title: string; mode: Mode; pair: () => [number, number] };

export type RevisionTopic = {
  id: RevisionTopicId;
  label: string;
  /** Short name for the home tile, e.g. "la soustraction". */
  name: string;
  art: ArtKey;
  op: Op;
  steps: Step[];
};

/** a − b with a between minA and maxA, and b between 1 and maxB (never all of a). */
function minusPair(minA: number, maxA: number, maxB = 9, minB = 1): [number, number] {
  const a = randomInt(minA, maxA);
  return [a, randomInt(minB, Math.min(maxB, a - 1))];
}

const SUBTRACTION: Step[] = [
  { title: "Enlever des objets (jusqu'à 6)", mode: "pictures", pair: () => minusPair(3, 6) },
  { title: "Enlever des objets (jusqu'à 10)", mode: "pictures-eq", pair: () => minusPair(6, 10, 5) },
  { title: "Reculer sur la ligne des nombres", mode: "line", pair: () => minusPair(5, 10, 5, 2) },
  { title: "Soustractions écrites jusqu'à 10", mode: "written", pair: () => minusPair(4, 10) },
  { title: "Petits problèmes", mode: "story", pair: () => minusPair(5, 10) },
  { title: "Le nombre caché (8 − ? = 5)", mode: "missing", pair: () => minusPair(5, 10) },
  {
    title: "Jusqu'à 20 sans passer la dizaine (17 − 4)",
    mode: "big",
    pair: () => {
      const a = randomInt(13, 19);
      return [a, randomInt(1, a % 10)];
    },
  },
  { title: "Enlever 10 (15 − 10)", mode: "tens", pair: () => [randomInt(11, 20), 10] },
  {
    title: "En passant par 10 (13 − 5)",
    mode: "bridge",
    pair: () => {
      const a = randomInt(11, 18);
      const b = randomInt(a % 10 + 1, Math.min(9, a - 2));
      return [a, b];
    },
  },
];

const ADDITION: Step[] = [
  {
    title: "Ajouter des objets (jusqu'à 6)",
    mode: "pictures",
    pair: () => {
      const a = randomInt(1, 4);
      return [a, randomInt(1, 6 - a)];
    },
  },
  {
    title: "Ajouter des objets (jusqu'à 10)",
    mode: "pictures-eq",
    pair: () => {
      const a = randomInt(2, 8);
      return [a, randomInt(1, 10 - a)];
    },
  },
  {
    title: "Avancer sur la ligne des nombres",
    mode: "line",
    pair: () => {
      const a = randomInt(1, 8);
      return [a, randomInt(2, Math.min(5, 10 - a))];
    },
  },
  {
    title: "Additions écrites jusqu'à 10",
    mode: "written",
    pair: () => {
      const a = randomInt(2, 8);
      return [a, randomInt(1, 10 - a)];
    },
  },
  {
    title: "Petits problèmes",
    mode: "story",
    pair: () => {
      const a = randomInt(2, 8);
      return [a, randomInt(1, 10 - a)];
    },
  },
  {
    title: "Le nombre caché (4 + ? = 9)",
    mode: "missing",
    pair: () => {
      const a = randomInt(1, 8);
      return [a, randomInt(1, 10 - a)];
    },
  },
  {
    title: "Jusqu'à 20 sans passer la dizaine (13 + 4)",
    mode: "big",
    pair: () => {
      const a = randomInt(11, 17);
      return [a, randomInt(1, 9 - (a % 10))];
    },
  },
  { title: "Ajouter 10 (6 + 10)", mode: "tens", pair: () => [randomInt(1, 10), 10] },
  {
    title: "En passant par 10 (8 + 5)",
    mode: "bridge",
    pair: () => {
      const a = randomInt(5, 9);
      return [a, randomInt(11 - a, 9)];
    },
  },
];

export const REVISION_TOPICS: Record<RevisionTopicId, RevisionTopic> = {
  soustraction: { id: "soustraction", label: "La soustraction", name: "la soustraction", art: "minus", op: "-", steps: SUBTRACTION },
  addition: { id: "addition", label: "L'addition", name: "l'addition", art: "plus", op: "+", steps: ADDITION },
};

export const REVISION_ORDER: RevisionTopicId[] = ["soustraction", "addition"];

const SIGN: Record<Op, string> = { "-": "−", "+": "+" };
const WORD: Record<Op, string> = { "-": "moins", "+": "plus" };

function line(from: number, to: number, viaTen = false): LineVisual {
  return { kind: "line", from, to, lo: Math.max(0, Math.min(from, to) - 1), hi: Math.min(20, Math.max(from, to) + 1), viaTen };
}

/** The opening lesson: one worked example with the theme's objects. */
export function revisionLesson(topicId: RevisionTopicId, theme: Theme) {
  const item = theme.items[0];
  if (topicId === "soustraction") {
    return {
      title: "La soustraction, c'est enlever !",
      text: `Il y a 5 ${item.plural}. On en enlève 2 : on les barre. Il en reste 3 ! On écrit 5 − 2 = 3, et on dit « 5 moins 2 égale 3 ».`,
      speak: `La soustraction, c'est enlever ! Regarde : il y a 5 ${item.plural}. On en enlève 2, on les barre. Il en reste 3 ! On écrit 5 moins 2 égale 3.`,
      visual: { kind: "pictures", art: item.art, a: 5, b: 2, op: "-" } as PicturesVisual,
      equation: "5 − 2 = 3",
    };
  }
  return {
    title: "L'addition, c'est mettre ensemble !",
    text: `Il y a 3 ${item.plural}, et on en ajoute 2. En tout, il y en a 5 ! On écrit 3 + 2 = 5, et on dit « 3 plus 2 égale 5 ».`,
    speak: `L'addition, c'est mettre ensemble ! Regarde : il y a 3 ${item.plural}, et on en ajoute 2. En tout, il y en a 5 ! On écrit 3 plus 2 égale 5.`,
    visual: { kind: "pictures", art: item.art, a: 3, b: 2, op: "+" } as PicturesVisual,
    equation: "3 + 2 = 5",
  };
}

function generateOnce(topicId: RevisionTopicId, stepIndex: number, theme: Theme): RevisionQuestion {
  const topic = REVISION_TOPICS[topicId];
  const step = topic.steps[stepIndex];
  const op = topic.op;
  const minus = op === "-";
  const [a, b] = step.pair();
  const c = minus ? a - b : a + b;
  const item = pick(theme.items);
  const nChoices = stepIndex <= 2 ? 3 : 4;
  const pictures: PicturesVisual = { kind: "pictures", art: item.art, a, b, op };
  const equation = `${a} ${SIGN[op]} ${b} = ?`;
  const asked = `Combien font ${a} ${WORD[op]} ${b} ?`;
  const bonds = (n: number) => `${n} bond${n > 1 ? "s" : ""}`;

  let prompt = asked;
  let shownEquation: string | undefined = equation;
  let visual: RevisionVisual | undefined;
  let helper: RevisionQuestion["helper"];
  let answer = c;

  switch (step.mode) {
    case "pictures":
      shownEquation = undefined;
      visual = pictures;
      prompt = minus
        ? `Il y a ${a} ${item.plural}. On en enlève ${b}. Combien en reste-t-il ?`
        : `Il y a ${a} ${item.plural}, et on en ajoute ${b}. Combien y en a-t-il en tout ?`;
      break;
    case "pictures-eq":
      visual = pictures;
      prompt = minus ? `${a} ${item.plural}, on en enlève ${b}. Combien en reste-t-il ?` : `${a} ${item.plural} et encore ${b}. Combien en tout ?`;
      break;
    case "line":
      visual = line(a, c);
      prompt = minus ? `Pars de ${a} et recule de ${bonds(b)}. Où arrives-tu ?` : `Pars de ${a} et avance de ${bonds(b)}. Où arrives-tu ?`;
      break;
    case "written":
      helper = { visual: pictures, tip: minus ? "Aide-toi des images : compte ceux qui restent !" : "Aide-toi des images : compte-les tous !" };
      break;
    case "story": {
      shownEquation = undefined;
      const verb = minus ? pick(["en donne", "en perd", "en range"]) : pick(["en trouve", "en gagne", "en reçoit"]);
      prompt = minus
        ? `Loukas a ${a} ${item.plural}. Il ${verb} ${b}. Combien lui en reste-t-il ?`
        : `Loukas a ${a} ${item.plural}. Il ${verb} ${b} de plus. Combien en a-t-il maintenant ?`;
      helper = { visual: pictures, tip: `C'est ${a} ${WORD[op]} ${b}. Compte avec les images !` };
      break;
    }
    case "missing":
      answer = b;
      shownEquation = `${a} ${SIGN[op]} ? = ${c}`;
      prompt = minus ? `Quel nombre manque ? ${a} moins combien égale ${c} ?` : `Quel nombre manque ? ${a} plus combien égale ${c} ?`;
      helper = minus
        ? { visual: line(c, a), tip: `Astuce : pars de ${c} et avance jusqu'à ${a}. Compte les bonds !` }
        : { visual: line(a, c), tip: `Astuce : pars de ${a} et avance jusqu'à ${c}. Compte les bonds !` };
      break;
    case "big":
      helper = { visual: line(a, c), tip: minus ? `Recule de ${bonds(b)} sur la ligne.` : `Avance de ${bonds(b)} sur la ligne.` };
      break;
    case "tens":
      helper = {
        visual: line(a, c),
        tip: minus ? "Enlever 10, c'est enlever une dizaine : le chiffre des unités ne change pas !" : "Ajouter 10, c'est ajouter une dizaine : le chiffre des unités ne change pas !",
      };
      break;
    case "bridge": {
      const first = minus ? a - 10 : 10 - a;
      helper = {
        visual: line(a, c, true),
        tip: minus
          ? `Astuce : recule d'abord de ${first} pour arriver à 10, puis encore de ${b - first}.`
          : `Astuce : avance d'abord de ${first} pour arriver à 10, puis encore de ${b - first}.`,
      };
      break;
    }
  }

  const max = Math.max(a, c, answer) + 3;
  const choices = buildChoices(answer, nChoices, 0, max);
  return {
    id: uid(),
    step: stepIndex,
    prompt,
    equation: shownEquation,
    visual,
    helper,
    choices,
    answerIndex: choices.indexOf(answer),
  };
}

export function generateRevisionQuestion(topicId: RevisionTopicId, step: number, theme: Theme): RevisionQuestion {
  return remember(
    () => generateOnce(topicId, step, theme),
    (q) => `rev|${topicId}|${q.prompt}|${q.equation ?? ""}`,
  );
}
