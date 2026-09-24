"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Level, Subject } from "./types";

const STORAGE_KEY = "kid-app-progress";

export type ProgressState = {
  stars: Record<Subject, number>;
  level: Record<Subject, Level>;
  badges: string[];
  sessionsCompleted: number;
  lastSessionDate: string | null;
};

const DEFAULT_STATE: ProgressState = {
  stars: { maths: 0, francais: 0 },
  level: { maths: 1, francais: 1 },
  badges: [],
  sessionsCompleted: 0,
  lastSessionDate: null,
};

// Stars needed to reach level 2 and level 3.
const LEVEL_THRESHOLDS = [0, 8, 20];

function levelForStars(stars: number): Level {
  if (stars >= LEVEL_THRESHOLDS[2]) return 3;
  if (stars >= LEVEL_THRESHOLDS[1]) return 2;
  return 1;
}

type ProgressContextValue = {
  progress: ProgressState;
  ready: boolean;
  addStars: (subject: Subject, amount: number) => { leveledUp: boolean };
  addBadge: (badgeId: string) => void;
  recordSession: () => void;
  totalStars: number;
  starsToNextLevel: (subject: Subject) => number | null;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressState>(DEFAULT_STATE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<ProgressState>;
        // Read after mount (not in a lazy useState initializer) so server and
        // client agree on the first render; only then adopt the stored value.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setProgress({ ...DEFAULT_STATE, ...parsed });
      }
    } catch {
      // ignore malformed/unavailable storage
    }
    setReady(true);
  }, []);

  function persist(next: ProgressState) {
    setProgress(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore write errors
    }
  }

  function addStars(subject: Subject, amount: number) {
    const nextStars = { ...progress.stars, [subject]: progress.stars[subject] + amount };
    const prevLevel = progress.level[subject];
    const nextLevel = levelForStars(nextStars[subject]);
    const nextLevels = { ...progress.level, [subject]: nextLevel };
    persist({ ...progress, stars: nextStars, level: nextLevels });
    return { leveledUp: nextLevel > prevLevel };
  }

  function addBadge(badgeId: string) {
    if (progress.badges.includes(badgeId)) return;
    persist({ ...progress, badges: [...progress.badges, badgeId] });
  }

  function recordSession() {
    persist({
      ...progress,
      sessionsCompleted: progress.sessionsCompleted + 1,
      lastSessionDate: new Date().toISOString(),
    });
  }

  function starsToNextLevel(subject: Subject): number | null {
    const level = progress.level[subject];
    if (level >= 3) return null;
    const nextThreshold = LEVEL_THRESHOLDS[level];
    return Math.max(0, nextThreshold - progress.stars[subject]);
  }

  const totalStars = progress.stars.maths + progress.stars.francais;

  return (
    <ProgressContext.Provider
      value={{ progress, ready, addStars, addBadge, recordSession, totalStars, starsToNextLevel }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within ProgressProvider");
  return ctx;
}
