import { Controls } from "./components/Controls";
import { GameOver } from "./components/GameOver";
import { Grid } from "./components/Grid";
import { Hud } from "./components/Hud";
import { useGame } from "./useGame";

export function App() {
  const game = useGame();

  return (
    <main className="app">
      <header className="app__header">
        <h1 className="app__title">Skyjo Solo</h1>
        <p className="app__tagline">Lower your grid. Fewer turns win.</p>
      </header>

      <Hud state={game.state} score={game.score} />

      <Grid
        state={game.state}
        isTargetable={game.isTargetable}
        onPick={game.pickCell}
      />

      <Controls game={game} />

      {game.phase === "over" && (
        <GameOver
          state={game.state}
          score={game.score}
          onNewGame={() => game.newGame()}
        />
      )}

      <footer className="app__footer">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => game.newGame()}
        >
          Restart
        </button>
      </footer>
    </main>
  );
}
