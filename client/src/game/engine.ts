// Pure game engine for Skyjo Solo: new game, actions, column clears, end
// condition and scoring. No I/O, no React — trivially unit-testable and
// portable to an on-chain context later (CONTEXT.md §6).

import { deal } from "./deck";
import { mulberry32, randomSeed } from "./rng";
import {
  CELL_COUNT,
  type Cell,
  COLS,
  type GameState,
  ROWS,
  START_SCORE,
} from "./types";

/** Column index (0..COLS-1) → the 3 cell indices stacked in that column. */
export function columnCells(col: number): [number, number, number] {
  return [col, col + COLS, col + COLS * 2];
}

function withCell(grid: readonly Cell[], index: number, cell: Cell): Cell[] {
  const next = grid.slice();
  next[index] = cell;
  return next;
}

/**
 * Creates a fresh game: deal 12 hidden cells, 138-card draw pile, score 100.
 * Pass a `seed` for deterministic games (tests); omit for a random one.
 */
export function newGame(seed: number = randomSeed()): GameState {
  const rng = mulberry32(seed);
  const { dealt, deck } = deal(rng, CELL_COUNT);
  const grid: Cell[] = dealt.map((value) => ({ value, state: "hidden" }));
  return {
    grid,
    deck,
    discard: [],
    drawn: null,
    turns: 0,
    pendingSpy: false,
    over: false,
  };
}

// --- Guards ---------------------------------------------------------------

export function canDraw(s: GameState): boolean {
  return !s.over && !s.pendingSpy && s.drawn === null && s.deck.length > 0;
}

export function canReplace(s: GameState, index: number): boolean {
  return (
    !s.over &&
    s.drawn !== null &&
    !s.pendingSpy &&
    isIndex(index) &&
    s.grid[index].state !== "removed"
  );
}

export function canFlip(s: GameState, index: number): boolean {
  return (
    !s.over &&
    s.drawn !== null &&
    !s.pendingSpy &&
    isIndex(index) &&
    isHiddenLike(s.grid[index])
  );
}

export function canSpy(s: GameState, index: number): boolean {
  return s.pendingSpy && isIndex(index) && s.grid[index].state === "hidden";
}

function isIndex(index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < CELL_COUNT;
}

/** `hidden` and `spied` are both "hidden for state" — flippable, not visible. */
function isHiddenLike(cell: Cell): boolean {
  return cell.state === "hidden" || cell.state === "spied";
}

// --- Actions --------------------------------------------------------------

/** Pay the turn cost and draw the next number from the deck. */
export function draw(s: GameState): GameState {
  if (!canDraw(s)) throw new Error("draw: not allowed in current state");
  const deck = s.deck.slice();
  const drawn = deck.pop() as number;
  return { ...s, deck, drawn, turns: s.turns + 1 };
}

/**
 * (A) Replace any non-removed cell with the drawn number. The replaced value
 * goes to the discard; the drawn number is placed `visible` in that cell.
 */
export function replace(s: GameState, index: number): GameState {
  if (!canReplace(s, index)) throw new Error("replace: not allowed");
  const drawn = s.drawn as number;
  const old = s.grid[index];
  const grid = withCell(s.grid, index, { value: drawn, state: "visible" });
  const discard = [...s.discard, old.value];
  return resolve({ ...s, grid, discard, drawn: null }, index);
}

/**
 * (B) Discard + Flip: discard the drawn number and reveal one hidden/spied
 * cell, turning it `visible`.
 */
export function discardFlip(s: GameState, index: number): GameState {
  if (!canFlip(s, index)) throw new Error("discardFlip: not allowed");
  const drawn = s.drawn as number;
  const cell = s.grid[index];
  const grid = withCell(s.grid, index, { value: cell.value, state: "visible" });
  const discard = [...s.discard, drawn];
  return resolve({ ...s, grid, discard, drawn: null }, index);
}

/** Optional post-clear spy: learn a hidden cell's value; it stays hidden-for-state. */
export function spy(s: GameState, index: number): GameState {
  if (!canSpy(s, index)) throw new Error("spy: not allowed");
  const cell = s.grid[index];
  const grid = withCell(s.grid, index, { value: cell.value, state: "spied" });
  return { ...s, grid, pendingSpy: false };
}

/** Decline the optional spy granted by a column clear. */
export function skipSpy(s: GameState): GameState {
  if (!s.pendingSpy) return s;
  return { ...s, pendingSpy: false };
}

// --- Resolution: column clears + end condition ----------------------------

/**
 * After an action touched `index`, clear its column if the 3 cells are all
 * visible and equal, grant an optional spy if a hidden cell remains, then
 * recompute the end condition.
 */
function resolve(s: GameState, index: number): GameState {
  const col = index % COLS;
  const [a, b, c] = columnCells(col);
  const cells = [s.grid[a], s.grid[b], s.grid[c]];
  const allVisible = cells.every((cell) => cell.state === "visible");
  const equal =
    cells[0].value === cells[1].value && cells[1].value === cells[2].value;

  let grid: readonly Cell[] = s.grid;
  let pendingSpy = false;
  if (allVisible && equal) {
    const next = s.grid.slice();
    for (const i of [a, b, c])
      next[i] = { value: next[i].value, state: "removed" };
    grid = next;
    pendingSpy = next.some((cell) => cell.state === "hidden");
  }

  const over = grid.every(
    (cell) => cell.state === "visible" || cell.state === "removed",
  );
  return { ...s, grid, pendingSpy, over };
}

// --- Selectors ------------------------------------------------------------

/** Sum of values in `visible` cells (the only ones that count). */
export function visibleSum(s: GameState): number {
  return s.grid.reduce(
    (sum, cell) => (cell.state === "visible" ? sum + cell.value : sum),
    0,
  );
}

/**
 * Current/running score = 100 − turns − (sum of visible grid values).
 * `removed` cells count 0; `spied`/`hidden` are not yet counted. At game end
 * this is the final score (CONTEXT.md §4).
 */
export function score(s: GameState): number {
  return START_SCORE - s.turns - visibleSum(s);
}

export { CELL_COUNT, COLS, ROWS };
