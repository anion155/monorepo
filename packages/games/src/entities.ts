import { createUseContext } from "@anion155/shared/react";
import { createContext } from "react";

import type { EntityController } from "./entity";

export type IEntities = {
  [Symbol.iterator](): Iterator<EntityController>;
  getEntity(id: string): EntityController | undefined;
  appendEntity(child: EntityController): void;
  removeEntity(child: EntityController): void;
  clearEntities(): void;
};

export const EntitiesContext = createContext<IEntities | undefined>(undefined);
export const useEntitiesContext = createUseContext(EntitiesContext, "EntitiesContext");
