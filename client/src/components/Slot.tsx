import type { Cell } from "../game/types";

/** Bucket a value into a hue band purely for visual scanning (no card metaphor). */
function band(value: number): string {
  if (value < 0) return "neg";
  if (value === 0) return "zero";
  if (value <= 4) return "low";
  if (value <= 8) return "mid";
  return "high";
}

interface SlotProps {
  cell: Cell;
  targetable: boolean;
  onPick: () => void;
}

/**
 * A single numeric slot. A `hidden` slot shows `?`; revealing it fills in a
 * number — there is deliberately no card imagery or flip (CONTEXT.md §6).
 */
export function Slot({ cell, targetable, onPick }: SlotProps) {
  const { value, state } = cell;
  const classes = ["slot", `slot--${state}`];
  if (state === "visible" || state === "spied")
    classes.push(`slot--${band(value)}`);
  if (targetable) classes.push("slot--targetable");

  const content = state === "hidden" ? "?" : state === "removed" ? "" : value;

  return (
    <button
      type="button"
      className={classes.join(" ")}
      disabled={!targetable}
      aria-disabled={!targetable}
      onClick={targetable ? onPick : undefined}
    >
      <span className="slot__value">{content}</span>
      {state === "spied" && <span className="slot__badge">spied</span>}
    </button>
  );
}
