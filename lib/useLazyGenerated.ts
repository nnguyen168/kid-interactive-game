"use client";

import { useEffect, useState } from "react";

/**
 * Generates a value (often randomized) the first time `condition` becomes
 * true, instead of during render. Reading randomness directly in render (or
 * in a lazy useState initializer) would run before hydration and could
 * mismatch the server-rendered markup, so the first value is produced here,
 * after mount. Returns the same setter as useState for later updates from
 * event handlers (e.g. moving to the next question).
 */
export function useLazyGenerated<T>(
  condition: boolean,
  factory: () => T
): [T | null, (value: T) => void] {
  const [value, setValue] = useState<T | null>(null);

  useEffect(() => {
    if (condition && value === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValue(factory());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [condition, value]);

  return [value, setValue];
}
