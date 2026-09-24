// Remembers the last questions asked so a round does not repeat itself.
const recent: string[] = [];
const MEMORY = 30;

/** Calls `generate` until it produces a question not asked recently (a few tries at most). */
export function remember<Q>(generate: () => Q, keyOf: (q: Q) => string, tries = 12): Q {
  let q = generate();
  for (let i = 0; i < tries && recent.includes(keyOf(q)); i++) q = generate();
  recent.push(keyOf(q));
  if (recent.length > MEMORY) recent.shift();
  return q;
}
