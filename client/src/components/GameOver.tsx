import { visibleSum } from "../game/engine";
import { COLUMN_CLEAR_BONUS, type GameState } from "../game/types";

interface GameOverProps {
  state: GameState;
  score: number;
  onNewGame: () => void;
}

/** End-of-game overlay with the final score breakdown. */
export function GameOver({ state, score, onNewGame }: GameOverProps) {
  const grid = visibleSum(state);
  const bonus = COLUMN_CLEAR_BONUS * state.cleared;
  return (
    <div className="overlay">
      <div className="overlay__panel">
        <h2 className="overlay__title">Grid cleared</h2>
        <p className="overlay__score">{score}</p>
        <p className="overlay__breakdown">
          100 − {state.turns} turns − {grid} grid
          {bonus > 0 && ` + ${bonus} clears`}
        </p>
        <button type="button" className="btn btn--primary" onClick={onNewGame}>
          New game
        </button>
      </div>
    </div>
  );
}
