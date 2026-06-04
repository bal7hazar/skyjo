import { useCallback, useMemo, useState } from "react";
import * as engine from "./game/engine";
import { randomSeed } from "./game/rng";
import type { GameState } from "./game/types";

/** Which action the player selected after drawing, before picking a slot. */
export type Interaction = "replace" | "flip" | null;

/** High-level phase the UI renders from. */
export type Phase = "predraw" | "choose" | "targeting" | "spy" | "over";

export interface Game {
  state: GameState;
  action: Interaction;
  phase: Phase;
  score: number;
  /** True if a slot is a valid target for the current phase/action. */
  isTargetable: (index: number) => boolean;
  drawCard: () => void;
  chooseReplace: () => void;
  chooseFlip: () => void;
  cancelAction: () => void;
  pickCell: (index: number) => void;
  skipSpy: () => void;
  newGame: (seed?: number) => void;
}

export function useGame(initialSeed?: number): Game {
  const [state, setState] = useState<GameState>(() =>
    engine.newGame(initialSeed),
  );
  const [action, setAction] = useState<Interaction>(null);

  const newGame = useCallback((seed: number = randomSeed()) => {
    setState(engine.newGame(seed));
    setAction(null);
  }, []);

  const drawCard = useCallback(() => {
    setAction(null);
    setState((s) => (engine.canDraw(s) ? engine.draw(s) : s));
  }, []);

  const chooseReplace = useCallback(() => setAction("replace"), []);
  const chooseFlip = useCallback(() => setAction("flip"), []);
  const cancelAction = useCallback(() => setAction(null), []);

  const skipSpy = useCallback(() => {
    setState((s) => engine.skipSpy(s));
  }, []);

  const pickCell = useCallback(
    (index: number) => {
      setState((s) => {
        if (s.pendingSpy)
          return engine.canSpy(s, index) ? engine.spy(s, index) : s;
        if (action === "replace")
          return engine.canReplace(s, index) ? engine.replace(s, index) : s;
        if (action === "flip")
          return engine.canFlip(s, index) ? engine.discardFlip(s, index) : s;
        return s;
      });
      setAction(null);
    },
    [action],
  );

  const phase: Phase = useMemo(() => {
    if (state.over) return "over";
    if (state.pendingSpy) return "spy";
    if (state.drawn === null) return "predraw";
    return action ? "targeting" : "choose";
  }, [state.over, state.pendingSpy, state.drawn, action]);

  const isTargetable = useCallback(
    (index: number) => {
      if (phase === "spy") return engine.canSpy(state, index);
      if (phase === "targeting" && action === "replace")
        return engine.canReplace(state, index);
      if (phase === "targeting" && action === "flip")
        return engine.canFlip(state, index);
      return false;
    },
    [phase, action, state],
  );

  const score = useMemo(() => engine.score(state), [state]);

  return {
    state,
    action,
    phase,
    score,
    isTargetable,
    drawCard,
    chooseReplace,
    chooseFlip,
    cancelAction,
    pickCell,
    skipSpy,
    newGame,
  };
}
