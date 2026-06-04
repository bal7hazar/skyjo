import { describe, expect, it } from "vitest";
import {
  canDraw,
  canFlip,
  canReplace,
  canSpy,
  columnCells,
  discardFlip,
  draw,
  newGame,
  replace,
  score,
  skipSpy,
  spy,
  visibleSum,
} from "./engine";
import type { Cell, CellState, GameState } from "./types";

/** Build a state from a compact grid spec for targeted scenarios. */
function makeState(
  spec: ReadonlyArray<readonly [number, CellState]>,
  over: Partial<GameState> = {},
): GameState {
  const grid: Cell[] = spec.map(([value, state]) => ({ value, state }));
  return {
    grid,
    deck: [5],
    discard: [],
    drawn: null,
    turns: 0,
    pendingSpy: false,
    over: false,
    ...over,
  };
}

const HIDDEN = (v: number) => [v, "hidden"] as const;
const VIS = (v: number) => [v, "visible"] as const;

describe("newGame", () => {
  it("deals 12 hidden cells, a 138-card deck and score 100", () => {
    const s = newGame(1234);
    expect(s.grid).toHaveLength(12);
    expect(s.grid.every((c) => c.state === "hidden")).toBe(true);
    expect(s.deck).toHaveLength(138);
    expect(s.turns).toBe(0);
    expect(s.drawn).toBeNull();
    expect(s.over).toBe(false);
    expect(score(s)).toBe(100); // no visible cells yet
  });

  it("is deterministic for a given seed", () => {
    expect(newGame(7).grid).toEqual(newGame(7).grid);
    expect(newGame(7).grid).not.toEqual(newGame(8).grid);
  });
});

describe("columnCells", () => {
  it("returns the 3 vertically-stacked indices for each column", () => {
    expect(columnCells(0)).toEqual([0, 4, 8]);
    expect(columnCells(3)).toEqual([3, 7, 11]);
  });
});

describe("draw", () => {
  it("pays a turn, removes the top deck card and sets `drawn`", () => {
    const s0 = newGame(5);
    const top = s0.deck[s0.deck.length - 1];
    const s1 = draw(s0);
    expect(s1.turns).toBe(1);
    expect(s1.drawn).toBe(top);
    expect(s1.deck).toHaveLength(137);
    expect(score(s1)).toBe(99); // 100 − 1 turn
  });

  it("cannot draw twice without acting", () => {
    const s1 = draw(newGame(5));
    expect(canDraw(s1)).toBe(false);
    expect(() => draw(s1)).toThrow();
  });
});

describe("replace (A)", () => {
  it("places the drawn number visible and discards the old value", () => {
    const s = { ...makeState([HIDDEN(9), ...rest(11)]), drawn: 3 };
    const next = replace(s, 0);
    expect(next.grid[0]).toEqual({ value: 3, state: "visible" });
    expect(next.discard).toContain(9);
    expect(next.drawn).toBeNull();
  });

  it("can target a visible cell too", () => {
    const s = { ...makeState([VIS(12), ...rest(11)]), drawn: 1 };
    expect(canReplace(s, 0)).toBe(true);
    expect(replace(s, 0).grid[0]).toEqual({ value: 1, state: "visible" });
  });

  it("cannot target a removed cell", () => {
    const s = { ...makeState([[0, "removed"], ...rest(11)]), drawn: 1 };
    expect(canReplace(s, 0)).toBe(false);
  });
});

describe("discardFlip (B)", () => {
  it("reveals a hidden cell and discards the drawn number", () => {
    const s = { ...makeState([HIDDEN(8), ...rest(11)]), drawn: 4 };
    const next = discardFlip(s, 0);
    expect(next.grid[0]).toEqual({ value: 8, state: "visible" });
    expect(next.discard).toContain(4);
    expect(next.drawn).toBeNull();
  });

  it("can flip a spied cell (hidden-for-state)", () => {
    const s = { ...makeState([[6, "spied"], ...rest(11)]), drawn: 4 };
    expect(canFlip(s, 0)).toBe(true);
    expect(discardFlip(s, 0).grid[0]).toEqual({ value: 6, state: "visible" });
  });

  it("cannot flip an already-visible cell", () => {
    const s = { ...makeState([VIS(2), ...rest(11)]), drawn: 4 };
    expect(canFlip(s, 0)).toBe(false);
  });
});

describe("column clear + spy", () => {
  // Column 0 = indices 0,4,8. Two are visible 7s; the rest are hidden.
  function nearClear(): GameState {
    const spec: Array<readonly [number, CellState]> = Array.from(
      { length: 12 },
      () => HIDDEN(1) as readonly [number, CellState],
    );
    spec[0] = VIS(7);
    spec[4] = VIS(7);
    spec[8] = HIDDEN(0);
    return makeState(spec);
  }

  it("removes the 3 cells when a column becomes visible & equal, and offers a spy", () => {
    const s = { ...nearClear(), drawn: 7 };
    const next = replace(s, 8); // third 7 → column complete
    expect([0, 4, 8].every((i) => next.grid[i].state === "removed")).toBe(true);
    expect([0, 4, 8].every((i) => next.grid[i].value === 7)).toBe(true);
    expect(next.pendingSpy).toBe(true); // hidden cells remain
  });

  it("does not clear when the three values are not equal", () => {
    const s = { ...nearClear(), drawn: 5 };
    const next = replace(s, 8);
    expect(next.grid[8].state).toBe("visible");
    expect(next.pendingSpy).toBe(false);
  });

  it("spy marks one hidden cell as spied (value known, still hidden-for-state)", () => {
    const cleared = replace({ ...nearClear(), drawn: 7 }, 8);
    expect(canSpy(cleared, 1)).toBe(true);
    const spied = spy(cleared, 1);
    expect(spied.grid[1].state).toBe("spied");
    expect(spied.pendingSpy).toBe(false);
    expect(spied.over).toBe(false); // spied does not end the game
  });

  it("cannot spy a non-hidden cell, and blocks draw until resolved", () => {
    const cleared = replace({ ...nearClear(), drawn: 7 }, 8);
    expect(canSpy(cleared, 0)).toBe(false); // removed
    expect(canDraw(cleared)).toBe(false); // pendingSpy
    expect(canDraw(skipSpy(cleared))).toBe(true);
  });

  it("clears equal low/negative triples even though it can raise the total", () => {
    const spec: Array<readonly [number, CellState]> = Array.from(
      { length: 12 },
      () => HIDDEN(1) as readonly [number, CellState],
    );
    spec[0] = VIS(-2);
    spec[4] = VIS(-2);
    spec[8] = HIDDEN(-2);
    const s = { ...makeState(spec), drawn: -2 };
    const next = discardFlip(s, 8);
    expect([0, 4, 8].every((i) => next.grid[i].state === "removed")).toBe(true);
  });
});

describe("end condition & scoring", () => {
  it("ends once every cell is visible or removed (spied/hidden do not end it)", () => {
    // 11 visible, 1 spied → not over.
    const spec: Array<readonly [number, CellState]> = Array.from(
      { length: 12 },
      () => VIS(0) as readonly [number, CellState],
    );
    spec[11] = [3, "spied"];
    const s = { ...makeState(spec), drawn: 9 };
    // Flipping the last spied cell ends the game.
    const next = discardFlip(s, 11);
    expect(next.over).toBe(true);
  });

  it("final score = 100 − turns − sum(visible)", () => {
    const spec: Array<readonly [number, CellState]> = [
      VIS(5),
      VIS(5),
      VIS(2),
      VIS(0),
      VIS(1),
      VIS(1),
      VIS(1),
      VIS(0),
      VIS(0),
      VIS(0),
      VIS(0),
      VIS(0),
    ];
    const s = makeState(spec, { turns: 14, over: true });
    expect(visibleSum(s)).toBe(15);
    expect(score(s)).toBe(100 - 14 - 15); // 71
  });

  it("allows negative final scores", () => {
    const spec: Array<readonly [number, CellState]> = Array.from(
      { length: 12 },
      () => VIS(12) as readonly [number, CellState],
    );
    const s = makeState(spec, { turns: 30 });
    expect(score(s)).toBeLessThan(0);
  });

  it("removed cells contribute 0", () => {
    const spec: Array<readonly [number, CellState]> = Array.from(
      { length: 12 },
      () => [12, "removed"] as readonly [number, CellState],
    );
    const s = makeState(spec, { turns: 10, over: true });
    expect(visibleSum(s)).toBe(0);
    expect(score(s)).toBe(90);
  });
});

describe("full playthrough (integration)", () => {
  // A progress-driven bot: each turn it resolves one not-yet-visible cell
  // (hidden or spied) — placing the number on it when the number is low, else
  // revealing the cell's own value. It always takes the spy when offered. Since
  // every turn turns a hidden/spied cell visible (and column clears only remove
  // cells), the game is guaranteed to terminate. This exercises every action
  // path (draw / replace / discardFlip / spy) and proves the end condition is
  // always reachable.
  function playToEnd(seed: number): GameState {
    let s = newGame(seed);
    let guard = 0;
    while (!s.over) {
      if (++guard > 500) throw new Error("game did not terminate");

      if (s.pendingSpy) {
        const hidden = s.grid.findIndex((c) => c.state === "hidden");
        s = hidden >= 0 ? spy(s, hidden) : skipSpy(s);
        continue;
      }

      s = draw(s);
      const drawn = s.drawn as number;

      // Pick a cell that still needs to become visible to end the game.
      const target = s.grid.findIndex(
        (c) => c.state === "hidden" || c.state === "spied",
      );
      // A low number is worth keeping (place it); otherwise reveal in place.
      s = drawn <= 2 ? replace(s, target) : discardFlip(s, target);
    }
    return s;
  }

  it.each([
    1, 2, 3, 7, 42, 100, 2024,
  ])("always terminates with a consistent final score (seed %i)", (seed) => {
    const end = playToEnd(seed);
    expect(end.over).toBe(true);
    // End condition: nothing hidden or spied remains.
    expect(
      end.grid.every((c) => c.state === "visible" || c.state === "removed"),
    ).toBe(true);
    expect(end.drawn).toBeNull();
    expect(end.pendingSpy).toBe(false);
    // Scoring identity holds.
    expect(score(end)).toBe(100 - end.turns - visibleSum(end));
  });
});

/** Fill the remaining (n) cells with hidden 1s for makeState specs. */
function rest(n: number): Array<readonly [number, CellState]> {
  return Array.from({ length: n }, () => HIDDEN(1));
}
