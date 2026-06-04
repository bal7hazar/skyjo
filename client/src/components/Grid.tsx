import type { GameState } from "../game/types";
import { Slot } from "./Slot";

interface GridProps {
  state: GameState;
  isTargetable: (index: number) => boolean;
  onPick: (index: number) => void;
}

/** The 3×4 board of numeric slots. */
export function Grid({ state, isTargetable, onPick }: GridProps) {
  return (
    <div className="grid">
      {state.grid.map((cell, index) => (
        <Slot
          // Index is a stable identity here: the grid is a fixed 12-slot board.
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length board
          key={index}
          cell={cell}
          targetable={isTargetable(index)}
          onPick={() => onPick(index)}
        />
      ))}
    </div>
  );
}
