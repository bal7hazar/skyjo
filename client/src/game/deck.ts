// Deck construction, shuffling and dealing for Skyjo Solo.
// Exact original-Skyjo proportions: 150 cards, values -2..12 (CONTEXT.md §3).

import type { Rng } from "./rng";
import type { CardValue } from "./types";

/** value → count. Sums to 150. */
export const DECK_COMPOSITION: ReadonlyArray<readonly [CardValue, number]> = [
  [-2, 5],
  [-1, 10],
  [0, 15],
  [1, 10],
  [2, 10],
  [3, 10],
  [4, 10],
  [5, 10],
  [6, 10],
  [7, 10],
  [8, 10],
  [9, 10],
  [10, 10],
  [11, 10],
  [12, 10],
];

export const DECK_SIZE = 150;

/** Builds the ordered 150-card multiset (before shuffling). */
export function buildDeck(): CardValue[] {
  const deck: CardValue[] = [];
  for (const [value, count] of DECK_COMPOSITION) {
    for (let i = 0; i < count; i++) deck.push(value);
  }
  return deck;
}

/** Fisher–Yates shuffle using the provided RNG. Returns a new array. */
export function shuffle(deck: readonly CardValue[], rng: Rng): CardValue[] {
  const out = deck.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

/**
 * Shuffles a fresh deck, deals the first 12 values into the grid and returns
 * both the dealt cards and the remaining 138-card draw pile.
 */
export function deal(
  rng: Rng,
  cellCount: number,
): {
  dealt: CardValue[];
  deck: CardValue[];
} {
  const shuffled = shuffle(buildDeck(), rng);
  const dealt = shuffled.slice(0, cellCount);
  const deck = shuffled.slice(cellCount);
  return { dealt, deck };
}
