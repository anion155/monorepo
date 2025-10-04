import { appendProperty } from "@anion155/shared";
import { createUseContext, useConst, useDeepMemo } from "@anion155/shared/react";
import { nanoid } from "nanoid";
import type { ForwardedRef, ReactNode } from "react";
import { createContext, useEffect, useImperativeHandle } from "react";

import type { IEntities } from "./entities";
import { useEntitiesContext } from "./entities";
import { passChildren } from "./pass-children";

export class EntityController {
  readonly id = nanoid();
  readonly name: string;
  parent: IEntities | null = null;
  readonly components = new Map();

  constructor(name?: string) {
    Object.defineProperty(this, "parent", { enumerable: false });
    this.name = name ?? this.id;
  }
}
export const EntityContext = createContext<EntityController | undefined>(undefined);
export const useEntityContext = createUseContext(EntityContext, "EntityContext");

export const useEntityParent = (entity: EntityController) => {
  const parent = useEntitiesContext(true);
  useEffect(() => {
    if (!parent) return;
    parent.appendEntity(entity);
    return () => parent.removeEntity(entity);
  }, [entity, parent]);
  return entity;
};
export const useEntity = (name?: string, ref?: ForwardedRef<EntityController>) => {
  const entity = useConst(() => new EntityController(name));
  useImperativeHandle(ref, () => entity, [entity]);
  useEntityParent(entity);
  return entity;
};

type EntityProps = { ref?: ForwardedRef<EntityController>; name?: string; children?: ReactNode };
export const Entity = ({ ref, name, children }: EntityProps) => {
  const entity = useEntity(name, ref);
  return passChildren(<EntityContext.Provider value={entity} />, children);
};

export const NoEntity = ({ children }: { children?: ReactNode }) => children;

export type EntityComponent<Component, Props extends object> = {
  (props: Props): ReactNode;
  readonly name: string;
  get(entity: EntityController): Component | undefined;
};
export const createEntityComponent = <Component, Props extends object>(
  name: string,
  fabric: (entity: EntityController, props: Props) => Component,
): EntityComponent<Component, Props> => {
  const entities = new WeakMap<EntityController, Component>();
  const registerEntity = (entity: EntityController, component: Component) => {
    entity.components.set(Component.name, Component);
    entities.set(entity, component);
    return () => {
      entity.components.delete(Component.name);
      entities.delete(entity);
    };
  };
  const Component = (props: Props) => {
    const entity = useEntityContext();
    const memoizedProps = useDeepMemo(props);
    useEffect(() => registerEntity(entity, fabric(entity, memoizedProps)), [entity, memoizedProps]);
    return null;
  };
  appendProperty(Component, "name", { value: name, writable: false, enumerable: true, configurable: true });
  appendProperty(Component, "get", {
    value: (entity: EntityController) => entities.get(entity),
    writable: true,
    enumerable: false,
    configurable: true,
  });
  return Component;
};
