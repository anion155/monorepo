import { createUseContext, useConst } from "@anion155/shared/react";
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
  readonly components = new Map<string, unknown>();

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

export type EntityProps = { ref?: ForwardedRef<EntityController>; name?: string; children?: ReactNode };
export const Entity = ({ ref, name, children }: EntityProps) => {
  const entity = useEntity(name, ref);
  return passChildren(<EntityContext.Provider value={entity} />, children);
};

export const NoEntity = ({ children }: { children?: ReactNode }) => children;

export const createEntityComponent = <UseFabric extends (props: never) => unknown>(name: string, useFabric: UseFabric) => {
  type Component = ReturnType<UseFabric>;
  type Props = Parameters<UseFabric>[0];
  const get = (entity: EntityController) => entity.components.get(name) as Component;
  const useRegister: typeof useFabric = ((props: Props) => {
    const entity = useEntityContext();
    const component = useFabric(props);
    useEffect(() => {
      entity.components.set(name, component);
      return () => {
        entity.components.delete(name);
      };
    }, [component, entity]);
    return component;
  }) as never;
  const Register = ({
    ref,
    // @ts-expect-error - Props is object
    ...props
  }: { ref?: ForwardedRef<Component> } & Props) => {
    const component = useRegister(props as Props);
    useImperativeHandle(ref, () => component as never, [component]);
    return null;
  };
  return { name, get, useRegister, Register };
};
