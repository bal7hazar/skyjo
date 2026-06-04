import { visibleSum } from "../game/engine";
import type { GameState } from "../game/types";

interface GameOverProps {
  state: GameState;
  score: number;
  onNewGame: () => void;
}

/** End-of-game overlay with the final score breakdown. */
export function GameOver({ state, score, onNewGame }: GameOverProps) {
  const grid = visibleSum(state);
  return (
    <div className="overlay">
      <div className="overlay__panel">
        <h2 className="overlay__title">Grid cleared</h2>
        <p className="overlay__score">{score}</p>
        <p className="overlay__breakdown">
          100 − {state.turns} turns − {grid} grid
        </p>
        <button type="button" className="btn btn--primary" onClick={onNewGame}>
          New game
        </button>
      </div>
    </div>
  );
}
