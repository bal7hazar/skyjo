import { describe, expect, it } from "vitest";
import { buildDeck, DECK_COMPOSITION, DECK_SIZE, deal, shuffle } from "./deck";
import { mulberry32 } from "./rng";

function counts(values: readonly number[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
  return m;
}

describe("buildDeck", () => {
  it("has exactly 150 cards", () => {
    expect(buildDeck()).toHaveLength(DECK_SIZE);
  });

  it("matches the exact original-Skyjo composition", () => {
    const c = counts(buildDeck());
    for (const [value, count] of DECK_COMPOSITION) {
      expect(c.get(value)).toBe(count);
    }
    expect([...c.keys()].sort((a, b) => a - b)).toEqual([
      -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
  });
});

describe("shuffle", () => {
  it("is a permutation (same multiset, possibly reordered)", () => {
    const deck = buildDeck();
    const shuffled = shuffle(deck, mulberry32(1));
    expect(shuffled).toHaveLength(deck.length);
    expect(counts(shuffled)).toEqual(counts(deck));
  });

  it("does not mutate the input", () => {
    const deck = buildDeck();
    const snapshot = deck.slice();
    shuffle(deck, mulberry32(7));
    expect(deck).toEqual(snapshot);
  });

  it("is deterministic for a given seed", () => {
    const a = shuffle(buildDeck(), mulberry32(42));
    const b = shuffle(buildDeck(), mulberry32(42));
    expect(a).toEqual(b);
  });

  it("differs across seeds", () => {
    const a = shuffle(buildDeck(), mulberry32(1));
    const b = shuffle(buildDeck(), mulberry32(2));
    expect(a).not.toEqual(b);
  });
});

describe("deal", () => {
  it("deals 12 cards and leaves 138 in the draw pile", () => {
    const { dealt, deck } = deal(mulberry32(3), 12);
    expect(dealt).toHaveLength(12);
    expect(deck).toHaveLength(138);
  });

  it("preserves the full multiset across dealt + deck (no replacement)", () => {
    const { dealt, deck } = deal(mulberry32(99), 12);
    expect(counts([...dealt, ...deck])).toEqual(counts(buildDeck()));
  });
});
