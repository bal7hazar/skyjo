// Domain types for Skyjo Solo.
//
// Naming note (per CONTEXT.md §6): internally we may speak of "deck"/"card" for
// clarity, but nothing card-like ever reaches the screen — the player only sees
// numbers, slots and reveals.

/** A single card/number value in the deck (-2..12). */
export type CardValue = number;

/**
 * Per-cell lifecycle:
 * - `hidden`  face-down slot shown as `?`; its value is unknown to the player.
 * - `visible` revealed; its value is shown and counted in the score.
 * - `spied`   value is known to the player but still treated as `hidden` for
 *             game state and the end condition (the "generative privacy" reveal).
 * - `removed` part of a cleared column; gone from play and counts 0.
 */
export type CellState = "hidden" | "visible" | "spied" | "removed";

export interface Cell {
  /** Underlying number. Always present (even when hidden/spied/removed). */
  readonly value: CardValue;
  readonly state: CellState;
}

/** 3 rows × 4 columns = 12 cells, stored row-major (index = row * 4 + col). */
export const ROWS = 3;
export const COLS = 4;
export const CELL_COUNT = ROWS * COLS;
export const START_SCORE = 100;
/** Cells the player must reveal for free before the first draw (original Skyjo opening). */
export const INITIAL_REVEALS = 2;
/** Points awarded each time a column is completed and cleared. */
export const COLUMN_CLEAR_BONUS = 5;

export interface GameState {
  /** 12 cells, row-major. */
  readonly grid: readonly Cell[];
  /** Remaining draw pile (drawn cards are removed — no replacement). */
  readonly deck: readonly CardValue[];
  /** Discarded values (out of play). */
  readonly discard: readonly CardValue[];
  /** The currently drawn number awaiting an action, or null if none drawn yet. */
  readonly drawn: CardValue | null;
  /**
   * Free initial reveals still owed before the turn loop begins. Starts at
   * `INITIAL_REVEALS` and counts down to 0 as the player reveals opening cells.
   */
  readonly pendingReveals: number;
  /** Number of turns taken (each draw costs 1 point). */
  readonly turns: number;
  /** Number of columns cleared so far (each adds a `COLUMN_CLEAR_BONUS`). */
  readonly cleared: number;
  /**
   * When a column was just cleared, the player may spy one hidden cell.
   * `true` while that optional spy is available; cleared by spying or skipping.
   */
  readonly pendingSpy: boolean;
  /** True once every remaining cell is `visible` or `removed`. */
  readonly over: boolean;
}
