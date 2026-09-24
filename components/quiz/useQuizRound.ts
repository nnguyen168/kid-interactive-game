"use client";

import { useState } from "react";
import { useLazyGenerated } from "@/lib/useLazyGenerated";

/** Runs a fixed-length round of questions, auto-advancing after each answer. */
export function useQuizRound<Q>({
  total,
  ready,
  generate,
  advanceDelay = 2000,
}: {
  total: number;
  ready: boolean;
  generate: () => Q;
  advanceDelay?: number;
}) {
  const [question, setQuestion] = useLazyGenerated(ready, generate);
  const [results, setResults] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);

  function recordResult(firstTry: boolean) {
    const next = [...results, firstTry];
    setResults(next);
    setTimeout(() => {
      if (next.length >= total) setDone(true);
      else setQuestion(generate());
    }, advanceDelay);
  }

  function restart() {
    setResults([]);
    setDone(false);
    setQuestion(generate());
  }

  return {
    question,
    results,
    done,
    recordResult,
    restart,
    firstTryCount: results.filter(Boolean).length,
  };
}
