import { EventEmitter } from "@anion155/shared/event-emitter";
import { createUseContext, useConst } from "@anion155/shared/react";
import type { ForwardedRef, ReactNode } from "react";
import { createContext, useImperativeHandle } from "react";

import { EntitiesContext, type IEntities } from "./entities";
import { type EntityController } from "./entity";

export class GameController extends EventEmitter<{ frame(deltaTime: DOMHighResTimeStamp): void }> implements IEntities {
  readonly #children = new Map<string, EntityController>();
  [Symbol.iterator](): Iterator<EntityController> {
    return this.#children.values();
  }
  getEntity(id: string): EntityController | undefined {
    return this.#children.get(id);
  }
  appendEntity(child: EntityController): void {
    this.#children.set(child.id, child);
    child.parent = this;
  }
  removeEntity(child: EntityController): void {
    child.parent = null;
    this.#children.delete(child.id);
  }
  clearEntities() {
    this.#children.forEach((child) => (child.parent = null));
    this.#children.clear();
  }
}
export const GameContext = createContext<GameController | undefined>(undefined);
export const useGameContext = createUseContext(GameContext, "GameContext");

type GameProps = {
  ref?: ForwardedRef<GameController>;
  children?: ReactNode;
};

export const GameProvider = ({ ref, children }: GameProps) => {
  const game = useConst(() => new GameController());
  Object.assign(globalThis, { game });
  useImperativeHandle(ref, () => game, [game]);

  return (
    <GameContext.Provider value={game}>
      <EntitiesContext.Provider value={game}>{children}</EntitiesContext.Provider>
    </GameContext.Provider>
  );
};
