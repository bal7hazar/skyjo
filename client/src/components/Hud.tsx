import type { GameState } from "../game/types";

interface HudProps {
  state: GameState;
  score: number;
}

/** Top status bar: running score, turns taken, and remaining draw pile. */
export function Hud({ state, score }: HudProps) {
  return (
    <div className="hud">
      <Stat label="Score" value={score} highlight />
      <Stat label="Turns" value={state.turns} />
      <Stat label="Numbers left" value={state.deck.length} />
    </div>
  );
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className={`stat${highlight ? " stat--highlight" : ""}`}>
      <span className="stat__value">{value}</span>
      <span className="stat__label">{label}</span>
    </div>
  );
}
