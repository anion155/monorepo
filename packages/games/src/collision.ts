import type { Rect } from "@anion155/linear/rect";

import { EntityComponent } from "./entity";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface CollisionsMap {}
}

export type CollisionBaseResult<T extends string> = { type: T; collision: Rect };
export type CollisionResultUnion = {
  [T in keyof CollisionsMap]: CollisionBaseResult<T> & CollisionsMap[T];
}[keyof CollisionsMap];
export type CollisionResults = IterableIterator<CollisionResultUnion>;

export abstract class CollisionEntityComponent<Value = void> extends EntityComponent<Value> {
  // static *collide(entity: Entity, rect: Rect): CollisionResults {
  //   const game = Game.getGame(entity);
  //   for (const component of game.eachComponents(CollisionEntityComponent)) {
  //     yield* component.collide(rect);
  //   }
  // }

  // abstract colisions(): IterableIterator<Rect>;
  abstract collide(targetRect: Rect): CollisionResults;
}
