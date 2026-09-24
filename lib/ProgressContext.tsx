"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { Level, Subject, ThemeId } from "./types";

const STORAGE_KEY = "kid-app-progress";

export type ProgressState = {
  stars: Record<Subject, number>;
  level: Record<Subject, Level>;
  badges: string[];
  sessionsCompleted: number;
  lastSessionDate: string | null;
  explored: Record<ThemeId, string[]>;
};

const DEFAULT_STATE: ProgressState = {
  stars: { maths: 0, francais: 0 },
  level: { maths: 1, francais: 1 },
  badges: [],
  sessionsCompleted: 0,
  lastSessionDate: null,
  explored: { chevalier: [], pompier: [], foot: [] },
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
  addStars: (subject: Subject, amount: number) => { leveledUp: boolean; level: Level };
  addBadge: (badgeId: string) => void;
  recordSession: () => void;
  totalStars: number;
  collectHotspot: (themeId: ThemeId, hotspotId: string) => void;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressState>(DEFAULT_STATE);
  const [ready, setReady] = useState(false);
  // Mutators read the latest committed state from here, so several updates in
  // one event handler (e.g. addBadge + recordSession) don't overwrite each other.
  const latest = useRef<ProgressState>(DEFAULT_STATE);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<ProgressState>;
        const loaded = { ...DEFAULT_STATE, ...parsed };
        latest.current = loaded;
        // Read after mount (not in a lazy useState initializer) so server and
        // client agree on the first render; only then adopt the stored value.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setProgress(loaded);
      }
    } catch {
      // ignore malformed/unavailable storage
    }
    setReady(true);
  }, []);

  function persist(next: ProgressState) {
    latest.current = next;
    setProgress(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore write errors
    }
  }

  function addStars(subject: Subject, amount: number) {
    const p = latest.current;
    const nextStars = { ...p.stars, [subject]: p.stars[subject] + amount };
    const prevLevel = p.level[subject];
    const nextLevel = levelForStars(nextStars[subject]);
    persist({ ...p, stars: nextStars, level: { ...p.level, [subject]: nextLevel } });
    return { leveledUp: nextLevel > prevLevel, level: nextLevel };
  }

  function addBadge(badgeId: string) {
    const p = latest.current;
    if (p.badges.includes(badgeId)) return;
    persist({ ...p, badges: [...p.badges, badgeId] });
  }

  function recordSession() {
    const p = latest.current;
    persist({ ...p, sessionsCompleted: p.sessionsCompleted + 1, lastSessionDate: new Date().toISOString() });
  }

  function collectHotspot(themeId: ThemeId, hotspotId: string) {
    const p = latest.current;
    if (p.explored[themeId].includes(hotspotId)) return;
    persist({ ...p, explored: { ...p.explored, [themeId]: [...p.explored[themeId], hotspotId] } });
  }

  const totalStars = progress.stars.maths + progress.stars.francais;

  return (
    <ProgressContext.Provider
      value={{ progress, ready, addStars, addBadge, recordSession, totalStars, collectHotspot }}
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
