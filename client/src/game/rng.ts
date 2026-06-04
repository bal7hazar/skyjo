// Small, dependency-free seedable PRNG so the deck (and therefore tests) is
// deterministic. mulberry32 — fast, good enough for shuffling a 150-card deck.

export type Rng = () => number;

/** Returns a deterministic [0,1) generator seeded by `seed`. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A non-deterministic seed for fresh games. */
export function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}
