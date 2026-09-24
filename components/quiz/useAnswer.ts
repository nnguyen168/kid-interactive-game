"use client";

import { useState } from "react";
import { sfx } from "@/lib/sfx";
import { randomEncouragement, randomPraise, speak } from "@/lib/speech";
import { MascotMood } from "../Mascot";
import { TileState } from "./ChoiceTile";

/**
 * Errorless-learning answer flow: a wrong tap only greys out that tile and
 * encourages a retry; after two misses the right answer glows as a hint.
 */
export function useAnswer(
  answerIndex: number,
  onSolved: (firstTry: boolean) => void,
  onWrong?: (attempt: number) => void
) {
  const [wrong, setWrong] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);
  const hint = !solved && wrong.length >= 2;
  const mood: MascotMood = solved ? "happy" : wrong.length > 0 ? "encourage" : "idle";

  function choose(i: number) {
    if (solved || wrong.includes(i)) return;
    if (i === answerIndex) {
      setSolved(true);
      sfx.correct();
      speak(randomPraise());
      onSolved(wrong.length === 0);
      return;
    }
    const next = [...wrong, i];
    setWrong(next);
    sfx.wrong();
    speak(next.length >= 2 ? "Regarde, la bonne réponse brille !" : randomEncouragement());
    onWrong?.(next.length);
  }

  function tileState(i: number): TileState {
    if (solved) return i === answerIndex ? "correct" : "dim";
    if (wrong.includes(i)) return "wrong";
    if (hint && i === answerIndex) return "hint";
    return "idle";
  }

  return { choose, tileState, mood, solved };
}
