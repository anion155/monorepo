import { EventEmitter } from "@anion155/shared/event-emitter";
import { createUseContext, useConst } from "@anion155/shared/react";
import type { ForwardedRef } from "react";
import { createContext, useImperativeHandle } from "react";

import { Loop } from "@/atoms/Loop";

import { GameCanvasLayer } from "./GameCanvasLayer";

const FPS_RATE = 1000 / 60;

class GameController extends EventEmitter<{ frame(deltaTime: DOMHighResTimeStamp): void }> {}
export type { GameController };
export const GameContext = createContext<GameController | undefined>(undefined);
export const useGameContext = createUseContext(GameContext, "GameContext");

type GameProps = {
  ref?: ForwardedRef<GameController>;
};

export const Game = ({ ref }: GameProps) => {
  const game = useConst(() => new GameController());
  useImperativeHandle(ref, () => game, [game]);

  return (
    <GameContext.Provider value={game}>
      <Loop ticks={{ [FPS_RATE]: game.events.frame }} />
      <GameCanvasLayer />
    </GameContext.Provider>
  );
};
