import { DeveloperError } from "@anion155/shared";

import type { Entity, EntityParams } from "./entity";
import { EntityHolder } from "./entity";

export type GameParams = OmitHelper<EntityParams, "parent">;

export abstract class Game extends EntityHolder {
  static getGame(from: Entity) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let entity: Entity<any> = from;
    while (true) {
      const parent = entity.parent;
      if (parent === null) throw new DeveloperError("No Game parent found");
      if (parent instanceof Game) return parent;
      if (!(parent instanceof EntityHolder)) throw new DeveloperError("No Game parent found");
      entity = parent;
    }
  }

  constructor(entityParams: GameParams) {
    super({ ...entityParams, parent: null });
  }
}
