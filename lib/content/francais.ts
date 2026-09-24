import { ArtKey } from "../art";
import { FrancaisChoice, FrancaisKind, FrancaisQuestion, Level, Theme, ThemeId } from "../types";
import { pick, shuffle, uid } from "../random";
import { remember } from "./recent";

/** Sounds (graphemes) the CP class works on; used by "Dans quel mot entends-tu … ?". */
type Sound = "on" | "ou" | "an" | "in" | "oi" | "ch";

type VocabEntry = {
  word: string; // with article, e.g. "le chat"
  spelling: string; // correctly accented, e.g. "château"
  art: ArtKey;
  /** Written syllables joined by "-", e.g. "ba-teau". */
  syl: string;
  /** Spoken syllable count when it is unambiguous for a child. */
  count?: number;
  sounds: Sound[];
  /** Rhyme family, e.g. "o" for bateau / vélo / chapeau. */
  rime?: string;
  /** Pronunciation too tricky for sound questions (e.g. "pingouin"). */
  tricky?: boolean;
};

function v(word: string, art: ArtKey, syl: string, sounds: Sound[] = [], rime?: string, count?: number, tricky = false): VocabEntry {
  const spelling = word.replace(/^(le |la |les |l')/, "");
  return { word, spelling, art, syl, sounds, rime, count, tricky };
}

const THEME_VOCAB: Record<ThemeId, VocabEntry[]> = {
  chevalier: [
    v("le château", "castle", "châ-teau", ["ch"], "o", 2),
    v("le bouclier", "shield", "bou-clier", ["ou"], undefined, undefined, true),
    v("le dragon", "dragon", "dra-gon", ["on"], "on", 2),
    v("la couronne", "crown", "cou-ronne", ["ou"]),
    v("le cheval", "horse", "che-val", ["ch"], undefined, 2),
    v("l'épée", "swords", "é-pée", [], "é", 2),
  ],
  pompier: [
    v("le camion", "fire-engine", "ca-mion", ["on"], "on"),
    v("le casque", "helmet", "cas-que", []),
    v("le feu", "fire", "feu", [], undefined, 1),
    v("l'échelle", "ladder", "é-chelle", ["ch"], "elle"),
    v("la sirène", "siren", "si-rène", []),
    v("l'extincteur", "extinguisher", "ex-tinc-teur", ["in"], "eur", 3),
  ],
  foot: [
    v("le ballon", "ball", "bal-lon", ["on"], "on", 2),
    v("le maillot", "tshirt", "mail-lot", [], "o", 2),
    v("le but", "goal", "but", [], undefined, 1),
    v("le trophée", "trophy", "tro-phée", [], "é", 2),
    v("le stade", "stadium", "sta-de", []),
  ],
  course: [
    v("la voiture", "racing-car", "voi-ture", ["oi"]),
    v("le drapeau", "checkered-flag", "dra-peau", [], "o", 2),
    v("la roue", "wheel", "roue", ["ou"], "ou", 1),
    v("la moto", "motorcycle", "mo-to", [], "o", 2),
    v("le chrono", "stopwatch", "chro-no", [], "o", 2, true),
    v("la coupe", "trophy", "cou-pe", ["ou"]),
  ],
};

const GENERIC_VOCAB: VocabEntry[] = [
  v("le chat", "cat", "chat", ["ch"], "a", 1),
  v("le chien", "dog", "chien", ["ch", "in"], "in", 1),
  v("la maison", "house", "mai-son", ["on"], "on", 2),
  v("le soleil", "sun", "so-leil", [], undefined, 2),
  v("la lune", "moon", "lu-ne", []),
  v("la pomme", "apple", "pom-me", []),
  v("le poisson", "fish", "pois-son", ["oi", "on"], "on", 2),
  v("la fleur", "flower", "fleur", [], "eur", 1),
  v("le livre", "book", "li-vre", []),
  v("l'oiseau", "bird", "oi-seau", ["oi"], "o", 2),
  v("l'arbre", "tree", "ar-bre", []),
  v("l'étoile", "star", "é-toi-le", ["oi"]),
  v("la fusée", "rocket", "fu-sée", [], "é", 2),
  v("le cadeau", "gift", "ca-deau", [], "o", 2),
  v("le pain", "bread", "pain", ["in"], "in", 1),
  v("le cœur", "heart", "cœur", [], "eur", 1),
  v("le lion", "lion", "lion", ["on"], "on", undefined),
  v("le lapin", "rabbit", "la-pin", ["in"], "in", 2),
  v("la souris", "mouse", "sou-ris", ["ou"], "i", 2),
  v("l'éléphant", "elephant", "é-lé-phant", ["an"], "an", 3),
  v("la grenouille", "frog", "gre-nouil-le", ["ou"]),
  v("l'escargot", "snail", "es-car-got", [], "o", 3),
  v("la tortue", "turtle", "tor-tue", []),
  v("le mouton", "sheep", "mou-ton", ["ou", "on"], "on", 2),
  v("la vache", "cow", "va-che", ["ch"]),
  v("le cochon", "pig", "co-chon", ["ch", "on"], "on", 2),
  v("le canard", "duck", "ca-nard", [], undefined, 2),
  v("l'ours", "bear", "ours", ["ou"], "ours", 1),
  v("le loup", "wolf", "loup", ["ou"], "ou", 1),
  v("le renard", "fox", "re-nard", [], undefined, 2),
  v("le hibou", "owl", "hi-bou", ["ou"], "ou", 2),
  v("l'abeille", "bee", "a-beil-le", []),
  v("le papillon", "butterfly", "pa-pil-lon", ["on"], "on", 3),
  v("le bus", "bus", "bus", [], undefined, 1),
  v("le train", "train", "train", ["in"], "in", 1),
  v("le bateau", "boat", "ba-teau", [], "o", 2),
  v("l'avion", "plane", "a-vion", ["on"], "on"),
  v("le vélo", "bike", "vé-lo", [], "o", 2),
  v("le chapeau", "hat", "cha-peau", ["ch"], "o", 2),
  v("la clé", "key", "clé", [], "é", 1),
  v("le bonbon", "candy", "bon-bon", ["on"], "on", 2),
  v("le gâteau", "cake", "gâ-teau", [], "o", 2),
  v("la banane", "banana", "ba-na-ne", []),
  v("la fraise", "strawberry", "frai-se", [], "aise"),
  v("la carotte", "carrot", "ca-rot-te", []),
  v("le fromage", "cheese", "fro-ma-ge", []),
  v("la tomate", "tomato", "to-ma-te", []),
  v("le raisin", "grapes", "rai-sin", ["in"], "in", 2),
  v("le citron", "lemon", "ci-tron", ["on"], "on", 2),
  v("le parapluie", "umbrella", "pa-ra-pluie", [], undefined, 3),
  v("la guitare", "guitar", "gui-ta-re", []),
  v("le tambour", "drum", "tam-bour", ["an", "ou"], undefined, 2),
  v("la cloche", "bell", "clo-che", ["ch"]),
  v("le champignon", "mushroom", "cham-pi-gnon", ["ch", "an", "on"], "on", 3),
  v("le crayon", "pencil", "cra-yon", ["on"], "on", 2),
  v("les ciseaux", "scissors", "ci-seaux", [], "o", 2),
  v("le nounours", "teddy", "nou-nours", ["ou"], "ours", 2),
  v("le robot", "robot", "ro-bot", [], "o", 2),
  v("la licorne", "unicorn", "li-cor-ne", []),
  v("le crocodile", "crocodile", "cro-co-di-le", []),
  v("la girafe", "giraffe", "gi-ra-fe", []),
  v("le zèbre", "zebra", "zè-bre", []),
  v("le singe", "monkey", "sin-ge", ["in"]),
  v("le pingouin", "penguin", "pin-gouin", [], "in", 2, true),
  v("la poule", "hen", "pou-le", ["ou"]),
  v("le tigre", "tiger", "ti-gre", []),
  v("le dauphin", "dolphin", "dau-phin", ["in"], "in", 2),
  v("le requin", "shark", "re-quin", ["in"], "in", 2),
  v("l'araignée", "spider", "a-rai-gnée", [], "é", 3),
  v("la fourmi", "ant", "four-mi", ["ou"], "i", 2),
  v("la coccinelle", "ladybug", "coc-ci-nel-le", [], "elle"),
  v("la poire", "pear", "poi-re", ["oi"]),
  v("la pastèque", "watermelon", "pas-tè-que", []),
  v("les cerises", "cherries", "ce-ri-ses", []),
  v("la glace", "ice-cream", "gla-ce", []),
  v("la sucette", "lollipop", "su-cet-te", [], "ette"),
  v("les chaussettes", "socks", "chaus-set-tes", ["ch"], "ette"),
  v("les lunettes", "glasses", "lu-net-tes", [], "ette"),
  v("la tente", "tent", "ten-te", ["an"]),
  v("l'ancre", "anchor", "an-cre", ["an"]),
  v("le sapin", "fir", "sa-pin", ["in"], "in", 2),
  v("le piano", "piano", "pia-no", [], "o"),
  v("la bague", "ring", "ba-gue", []),
  v("le lit", "bed", "lit", [], "i", 1),
  v("la chaise", "chair", "chai-se", ["ch"], "aise"),
  v("la porte", "door", "por-te", []),
  v("la salade", "cabbage", "sa-la-de", []),
  v("l'orange", "orange", "o-ran-ge", ["an"]),
  v("la voiture", "car", "voi-ture", ["oi"]),
];

const KINDS_BY_LEVEL: Record<Level, FrancaisKind[]> = {
  1: ["letter", "letter", "case", "word-picture", "first-syllable"],
  2: ["word-picture", "picture-word", "missing-letter", "syllables", "sound", "first-syllable", "case"],
  3: ["missing-syllable", "missing-letter", "rhyme", "sound", "picture-word", "alphabet", "syllables", "word-picture"],
};

const CHOICES_BY_LEVEL: Record<Level, number> = { 1: 3, 2: 4, 3: 4 };

const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");
/** Letters children often mix up, used as distractors. */
const LOOKALIKES: Record<string, string[]> = {
  b: ["d", "p", "q"],
  d: ["b", "p", "q"],
  p: ["q", "b", "d"],
  q: ["p", "g", "d"],
  m: ["n", "u", "w"],
  n: ["m", "u", "h"],
  u: ["n", "v", "m"],
  f: ["t", "l", "j"],
  t: ["f", "l", "j"],
  l: ["i", "t", "j"],
  g: ["q", "p", "j"],
  e: ["a", "o", "c"],
  a: ["o", "e", "d"],
  o: ["a", "c", "e"],
  v: ["w", "u", "y"],
  s: ["z", "c", "x"],
};

function allVocab(theme: Theme) {
  const themed = THEME_VOCAB[theme.id];
  // A theme word replaces a generic word with the same picture or spelling.
  return [...themed, ...GENERIC_VOCAB.filter((w) => !themed.some((t) => t.art === w.art || t.spelling === w.spelling))];
}

function pickTarget(theme: Theme, pool: VocabEntry[]) {
  const themed = pool.filter((w) => THEME_VOCAB[theme.id].includes(w));
  return Math.random() < 0.35 && themed.length ? pick(themed) : pick(pool);
}

const firstLetter = (w: VocabEntry) => w.spelling[0].toUpperCase();
const firstSyl = (w: VocabEntry) => w.syl.split("-")[0];
const sayWord = (w: VocabEntry) => w.word;

function pictureChoice(w: VocabEntry): FrancaisChoice {
  return { label: w.spelling, art: w.art, speak: w.word };
}

function textChoice(label: string, speak?: string): FrancaisChoice {
  return { label, speak: speak ?? label };
}

/** Distractors that differ from the target by `different`, preferring ones that look alike. */
function distractors(pool: VocabEntry[], target: VocabEntry, n: number, ok: (w: VocabEntry) => boolean, similar = false) {
  const candidates = shuffle(pool.filter((w) => w !== target && w.art !== target.art && ok(w)));
  if (!similar) return candidates.slice(0, n);
  const score = (w: VocabEntry) =>
    (w.spelling.slice(0, 2) === target.spelling.slice(0, 2) ? 2 : 0) + (w.spelling[0] === target.spelling[0] ? 1 : 0);
  return candidates.sort((a, b) => score(b) - score(a)).slice(0, n);
}

function finish(
  kind: FrancaisKind,
  stage: FrancaisQuestion["stage"],
  prompt: string,
  display: string,
  speak: string,
  answer: FrancaisChoice,
  others: FrancaisChoice[],
  displayArt?: ArtKey,
): FrancaisQuestion {
  const choices = shuffle([answer, ...others]);
  return { id: uid(), kind, stage, prompt, display, displayArt, speak, choices, answerIndex: choices.indexOf(answer) };
}

function generateOnce(theme: Theme, level: Level): FrancaisQuestion {
  const kind = pick(KINDS_BY_LEVEL[level]);
  const n = CHOICES_BY_LEVEL[level];
  const pool = allVocab(theme);

  switch (kind) {
    case "letter": {
      const target = pickTarget(theme, pool);
      const L = firstLetter(target);
      const others = distractors(pool, target, n - 1, (w) => firstLetter(w) !== L && w.spelling[0] !== target.spelling[0]);
      const prompt = `Quelle image commence par la lettre ${L} ?`;
      return finish(kind, "letter", prompt, L, prompt, pictureChoice(target), others.map(pictureChoice));
    }
    case "case": {
      const letter = pick(Object.keys(LOOKALIKES));
      const toLower = Math.random() < 0.5;
      const shown = toLower ? letter.toUpperCase() : letter;
      const answer = toLower ? letter : letter.toUpperCase();
      const wrong = shuffle(LOOKALIKES[letter]).slice(0, n - 1).map((l) => (toLower ? l : l.toUpperCase()));
      const prompt = toLower ? `Trouve la même lettre en minuscule.` : `Trouve la même lettre en majuscule.`;
      return finish(kind, "letter", prompt, shown, `${prompt} La lettre ${letter}.`, textChoice(answer, letter), wrong.map((l) => textChoice(l, l.toLowerCase())));
    }
    case "alphabet": {
      const i = Math.floor(Math.random() * 24) + 1;
      const before = Math.random() < 0.3;
      const shown = ALPHABET[i].toUpperCase();
      const answer = (before ? ALPHABET[i - 1] : ALPHABET[i + 1]).toUpperCase();
      const wrong = shuffle(
        [ALPHABET[i - 1], ALPHABET[i + 1], ALPHABET[i + 2] ?? "a", ALPHABET[i - 2] ?? "z", ALPHABET[i]]
          .map((l) => l.toUpperCase())
          .filter((l) => l !== answer),
      ).slice(0, n - 1);
      const prompt = before ? `Quelle lettre vient juste avant ${shown} ?` : `Quelle lettre vient juste après ${shown} ?`;
      return finish(kind, "letter", prompt, before ? `? ${shown}` : `${shown} ?`, prompt, textChoice(answer), wrong.map((l) => textChoice(l)));
    }
    case "word-picture": {
      const target = pickTarget(theme, pool);
      const others = distractors(pool, target, n - 1, () => true, level > 1);
      return finish(
        kind,
        "word",
        "Quelle image va avec ce mot ?",
        target.word,
        `Quelle image va avec le mot : ${target.word} ?`,
        pictureChoice(target),
        others.map(pictureChoice),
      );
    }
    case "picture-word": {
      const target = pickTarget(theme, pool);
      const others = distractors(pool, target, n - 1, (w) => w.spelling !== target.spelling, true);
      return finish(
        kind,
        "art",
        "Quel est le bon mot pour cette image ?",
        "",
        "Regarde l'image. Quel est le bon mot ?",
        textChoice(target.spelling, target.word),
        others.map((w) => textChoice(w.spelling, w.word)),
        target.art,
      );
    }
    case "first-syllable": {
      const target = pick(pool.filter((w) => w.syl.includes("-")));
      const s = firstSyl(target);
      const others = distractors(pool, target, n - 1, (w) => !w.spelling.startsWith(s) && firstSyl(w) !== s);
      const prompt = `Quelle image commence par « ${s} » ?`;
      return finish(kind, "letter", prompt, s, `Quelle image commence par ${s} ?`, pictureChoice(target), others.map(pictureChoice));
    }
    case "syllables": {
      const target = pick(pool.filter((w) => w.count));
      const answer = target.count!;
      const options = shuffle([1, 2, 3, 4].filter((c) => c !== answer)).slice(0, n - 1);
      return finish(
        kind,
        "art",
        `Combien de syllabes dans « ${target.spelling} » ? Tape dans tes mains !`,
        target.word,
        `Combien de syllabes dans le mot : ${target.spelling} ? Tape dans tes mains !`,
        textChoice(String(answer)),
        options.map((o) => textChoice(String(o))),
        target.art,
      );
    }
    case "sound": {
      const sound = pick<Sound>(["on", "ou", "an", "in", "oi", "ch"]);
      const clear = pool.filter((w) => !w.tricky);
      const target = pick(clear.filter((w) => w.sounds.includes(sound)));
      const others = distractors(clear, target, n - 1, (w) => !w.sounds.includes(sound));
      const prompt = `Dans quel mot entends-tu « ${sound} » ?`;
      return finish(kind, "letter", prompt, sound, `Dans quel mot entends-tu le son ${sound} ?`, pictureChoice(target), others.map(pictureChoice));
    }
    case "rhyme": {
      const families = pool.filter((w) => w.rime && pool.some((o) => o !== w && o.rime === w.rime && o.art !== w.art));
      const target = pick(families);
      const answer = pick(pool.filter((w) => w !== target && w.rime === target.rime && w.art !== target.art));
      const others = distractors(pool, answer, n - 1, (w) => w !== target && w.rime !== target.rime && !!w.rime);
      return finish(
        kind,
        "word",
        `Quel mot rime avec « ${target.spelling} » ?`,
        target.word,
        `Quel mot rime avec ${sayWord(target)} ?`,
        pictureChoice(answer),
        others.map(pictureChoice),
      );
    }
    case "missing-syllable": {
      const target = pick(pool.filter((w) => w.syl.split("-").length >= 2));
      const parts = target.syl.split("-");
      const hole = Math.floor(Math.random() * parts.length);
      const answer = parts[hole];
      const display = parts.map((p, i) => (i === hole ? "_" : p)).join("");
      const wrong = shuffle(
        pool
          .flatMap((w) => w.syl.split("-"))
          .filter((p, i, arr) => p !== answer && p.length >= 2 && Math.abs(p.length - answer.length) <= 1 && arr.indexOf(p) === i),
      ).slice(0, n - 1);
      return finish(
        kind,
        "blank",
        "Quelle syllabe manque ?",
        display,
        `Quelle syllabe manque dans le mot : ${target.word} ?`,
        textChoice(answer),
        wrong.map((p) => textChoice(p)),
        target.art,
      );
    }
    case "missing-letter":
    default: {
      // Blank out a plain a-z letter so accents stay visible.
      const target = pick(pool.filter((w) => w.spelling.length >= 4 && !w.spelling.includes(" ")));
      const letters = target.spelling.split("");
      const blankable = letters.map((ch, i) => (/[a-z]/.test(ch) ? i : -1)).filter((i) => i >= 0);
      const blankIndex = pick(blankable);
      const correct = letters[blankIndex];
      const display = letters.map((ch, i) => (i === blankIndex ? "_" : ch)).join("");
      const lookalike = LOOKALIKES[correct] ?? [];
      const wrong = [...shuffle(lookalike), ...shuffle(ALPHABET)].filter((l, i, arr) => l !== correct && arr.indexOf(l) === i).slice(0, n - 1);
      return finish(
        "missing-letter",
        "blank",
        "Quelle lettre manque ?",
        display,
        `Quelle lettre manque dans le mot : ${target.word} ?`,
        textChoice(correct),
        wrong.map((l) => textChoice(l)),
        target.art,
      );
    }
  }
}

export function generateFrancaisQuestion(theme: Theme, level: Level): FrancaisQuestion {
  return remember(
    () => generateOnce(theme, level),
    (q) => `${q.kind}|${q.display}|${q.displayArt ?? ""}|${q.choices[q.answerIndex].label}`,
  );
}

/** Every word picture used by the question bank (for asset checks). */
export const VOCAB_ART = [...new Set([...GENERIC_VOCAB, ...Object.values(THEME_VOCAB).flat()].map((w) => w.art))];
