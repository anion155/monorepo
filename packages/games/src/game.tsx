import { isIterable } from "@anion155/shared";
import { EventEmitter } from "@anion155/shared/event-emitter";
import { createUseContext, useConst } from "@anion155/shared/react";
import type { ForwardedRef, ReactNode } from "react";
import { createContext, useImperativeHandle } from "react";

import { EntitiesContext, type IEntities } from "./entities";
import { type EntityController } from "./entity";

export class GameController
  extends EventEmitter<{
    tick(deltaTime: DOMHighResTimeStamp): void;
    frame(deltaTime: DOMHighResTimeStamp): void;
  }>
  implements IEntities
{
  readonly #children = new Map<string, EntityController>();
  *[Symbol.iterator](): Iterator<EntityController> {
    const queue: EntityController[] = [...this.#children.values()];
    while (queue.length > 0) {
      const entity = queue.shift()!;
      yield entity;
      if (isIterable(entity)) queue.push(...(entity as Iterable<EntityController>));
    }
  }
  getEntity<Components extends Record<string, unknown> = Record<string, unknown>>(name: string): EntityController<Components> | undefined {
    const entity = this.#children.get(name) ?? Iterator.from(this).find((entity) => entity.name === name);
    return entity as never;
  }
  appendEntity(child: EntityController): void {
    this.#children.set(child.name, child);
    child.parent = this;
  }
  removeEntity(child: EntityController): void {
    child.parent = null;
    this.#children.delete(child.name);
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
