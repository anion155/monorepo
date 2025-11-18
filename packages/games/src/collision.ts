import type { Rect } from "@anion155/shared/linear/rect";

import { EntityComponent } from "./entity";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface CollisionsMap {}
}

export type CollisionBaseResult<T extends string> = { type: T; collision: Rect };
export type CollisionResultUnion = {
  [T in keyof CollisionsMap]: CollisionBaseResult<T> & CollisionsMap[T];
}[keyof CollisionsMap];
export type CollisionResults = Iterator<CollisionResultUnion>;

export abstract class CollisionEntityComponent<Value = void> extends EntityComponent<Value> {
  abstract collide(targetRect: Rect): CollisionResults;
}
