import { isDisposable } from "@anion155/shared";
import { createUseContext, useConst } from "@anion155/shared/react";
import { nanoid } from "nanoid";
import type { ForwardedRef, ReactNode } from "react";
import { createContext, useEffect, useImperativeHandle } from "react";

import type { IEntities } from "./entities";
import { useEntitiesContext } from "./entities";
import { passChildren } from "./pass-children";

export class EntityController<Components extends Record<string, unknown> = Record<string, unknown>> {
  readonly name: string;
  parent: IEntities | null = null;
  readonly components: Components = {} as never;

  constructor(name?: string) {
    Object.defineProperty(this, "parent", { enumerable: false });
    this.name = name ?? nanoid();
  }

  *findComponents<Component extends Constructable<never, unknown>>(Component: Component): Generator<InstanceType<Component>, void, unknown> {
    for (const component of Object.values(this.components)) {
      if (component instanceof Component) {
        yield component as never;
      }
    }
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
export const useEntity = <Components extends Record<string, unknown> = Record<string, unknown>>(
  name?: string,
  ref?: ForwardedRef<EntityController<Components>>,
) => {
  const entity = useConst(() => new EntityController<Components>(name));
  useImperativeHandle(ref, () => entity, [entity]);
  useEntityParent(entity);
  return entity;
};

export type EntityProps<Components extends Record<string, unknown> = Record<string, unknown>> = {
  ref?: ForwardedRef<EntityController<Components>>;
  name?: string;
  children?: ReactNode;
};
export const Entity = <Components extends Record<string, unknown> = Record<string, unknown>>({ ref, name, children }: EntityProps<Components>) => {
  const entity = useEntity(name, ref);
  return passChildren(<EntityContext.Provider value={entity} />, children);
};

export const NoEntity = ({ children }: { children?: ReactNode }) => children;

export const useRegisterEntityComponent = <Component extends { readonly name: string }>(component: Component, ref?: ForwardedRef<Component>) => {
  const entity = useEntityContext();
  useEffect(() => {
    if (!isDisposable(component)) return;
    return () => component[Symbol.dispose]();
  }, [component, entity.components]);
  useEffect(() => {
    entity.components[component.name] = component;
    return () => {
      delete entity.components[component.name];
    };
  }, [component, entity.components]);
  useImperativeHandle(ref, () => component, [component]);
};
