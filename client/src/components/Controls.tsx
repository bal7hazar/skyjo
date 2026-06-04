import type { Game } from "../useGame";

/** The incoming number + the phase-appropriate action buttons. */
export function Controls({ game }: { game: Game }) {
  const { state, phase, action } = game;

  return (
    <div className="controls">
      <Incoming value={state.drawn} dimmed={phase === "predraw"} />
      <div className="controls__panel">{renderPanel(game, phase, action)}</div>
    </div>
  );
}

/** The single "incoming number" — the abstract source, never a stack of cards. */
function Incoming({
  value,
  dimmed,
}: {
  value: number | null;
  dimmed: boolean;
}) {
  return (
    <div className={`incoming${dimmed ? " incoming--dim" : ""}`}>
      <span className="incoming__label">Incoming</span>
      <span className="incoming__value">{value ?? "—"}</span>
    </div>
  );
}

function renderPanel(game: Game, phase: Game["phase"], action: Game["action"]) {
  switch (phase) {
    case "predraw":
      return (
        <>
          <p className="hint">Draw the next number, then place or reveal.</p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={game.drawCard}
          >
            Draw a number
          </button>
        </>
      );
    case "choose":
      return (
        <>
          <p className="hint">
            Place this number, or discard it to reveal a slot.
          </p>
          <div className="btn-row">
            <button type="button" className="btn" onClick={game.chooseReplace}>
              Place in a slot
            </button>
            <button type="button" className="btn" onClick={game.chooseFlip}>
              Discard &amp; reveal
            </button>
          </div>
        </>
      );
    case "targeting":
      return (
        <>
          <p className="hint">
            {action === "replace"
              ? "Tap any slot to fill it with this number."
              : "Tap a hidden slot to reveal its number."}
          </p>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={game.cancelAction}
          >
            Back
          </button>
        </>
      );
    case "spy":
      return (
        <>
          <p className="hint">
            Column cleared! Spy one hidden slot to learn its number — it stays
            hidden.
          </p>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={game.skipSpy}
          >
            Skip spy
          </button>
        </>
      );
    case "over":
      return null;
  }
}
