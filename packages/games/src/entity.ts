import { createUseContext, useConst, useDeepMemo } from "@anion155/shared/react";
import { nanoid } from "nanoid";
import type { ForwardedRef, ReactNode } from "react";
import { createContext, useEffect, useImperativeHandle } from "react";

import type { IEntities } from "./entities";
import { useEntitiesContext } from "./entities";

export class EntityController {
  readonly id = nanoid();
  parent: IEntities | null = null;
  readonly components = new Set();

  constructor() {
    Object.defineProperty(this, "parent", { enumerable: false });
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
  }, []);
  return entity;
};
export const useEntity = (ref: ForwardedRef<EntityController> | undefined) => {
  const entity = useConst(() => new EntityController());
  useImperativeHandle(ref, () => entity, [entity]);
  useEntityParent(entity);
  return entity;
};

type EntityProps = { ref?: ForwardedRef<EntityController>; children?: ReactNode };
export const Entity = ({ ref, children }: EntityProps) => {
  useEntity(ref);
  return children;
};

export const NoEntity = ({ children }: { children?: ReactNode }) => children;

export const createEntityComponent = <Component, Props extends object>(
  name: string,
  fabric: (entity: EntityController, props: Props) => Component,
) => {
  const entities = new WeakMap<EntityController, Component>();
  const get = (entity: EntityController) => entities.get(entity);
  const registerEntity = (entity: EntityController, component: Component) => {
    entity.components.add(Component);
    entities.set(entity, component);
    return () => {
      entity.components.delete(Component);
      entities.delete(entity);
    };
  };
  const Provider = (props: Props) => {
    const entity = useEntityContext();
    const memoizedProps = useDeepMemo(props);
    useEffect(() => registerEntity(entity, fabric(entity, memoizedProps)), [entity]);
    return null;
  };
  Provider.displayName = `${name}Provider`;
  const Component = { name, get, Provider };
  return Component;
};
