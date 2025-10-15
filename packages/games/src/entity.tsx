import { hasTypedField, isDisposable } from "@anion155/shared";
import { createUseContext, useConst } from "@anion155/shared/react";
import { nanoid } from "nanoid";
import type { ForwardedRef, ReactNode } from "react";
import { createContext, useEffect, useImperativeHandle } from "react";

import type { IEntities } from "./entities";
import { useEntitiesContext } from "./entities";
import { type GameController, useGameContext } from "./game";
import { passChildren } from "./pass-children";

export class EntityController<Components extends Record<string, unknown> = Record<string, unknown>> {
  readonly name: string;
  parent: IEntities | null = null;
  readonly components: Components = {} as never;

  #renderProps: Record<keyof Components, unknown> = {} as never;
  renderComponent(name: keyof Components, game: GameController, props?: unknown) {
    props ??= this.#renderProps[name];
    const component = this.components[name];
    if (!component) {
      this.#renderProps[name] = props;
      return;
    }
    if (!hasTypedField(component, "useReact", "function")) return;
    (component as ReactfulEntityComponent<unknown>).useReact(props, this, game);
  }

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

export type ReactfulEntityComponent<Props> = {
  useReact(props: Props, entity: EntityController, game: GameController): void;
};
type InferComponentProps<Component> = Component extends ReactfulEntityComponent<infer Props> ? Props : undefined;
type InferComponentsProps<Components extends Record<string, unknown>, Key extends keyof Components = keyof Components> = Omit<
  UnionToIntersection<
    Key extends PropertyKey
      ? undefined extends InferComponentProps<Components[Key]>
        ? { [key in Key]?: InferComponentProps<Components[Key]> }
        : { [key in Key]: InferComponentProps<Components[Key]> }
      : never
  >,
  never
>;
export type EntityProps<Components extends Record<string, unknown> = Record<string, unknown>> = {
  ref?: ForwardedRef<EntityController<Components>>;
  name?: string;
  children?: ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
} & ({} extends InferComponentsProps<Components>
  ? { components?: InferComponentsProps<Components> }
  : { components: InferComponentsProps<Components> });
export const Entity = <Components extends Record<string, unknown> = Record<string, unknown>>({
  ref,
  name,
  children,
  components,
}: EntityProps<Components>) => {
  const game = useGameContext();
  const entity = useEntity(name, ref);
  if (components) {
    for (const [name, props] of Object.entries(components)) {
      entity.renderComponent(name, game, props);
    }
  }
  return passChildren(<EntityContext.Provider value={entity} />, children);
};

export const NoEntity = ({ children }: { children?: ReactNode }) => children;

export const useRegisterEntityComponent = <Component extends { readonly name: string }>(component: Component, ref?: ForwardedRef<Component>) => {
  const game = useGameContext();
  const entity = useEntityContext();
  useEffect(() => {
    if (!isDisposable(component)) return;
    return () => component[Symbol.dispose]();
  }, [component]);
  useEffect(() => {
    entity.components[component.name] = component;
    return () => {
      delete entity.components[component.name];
    };
  }, [component, entity, game]);
  entity.renderComponent(component.name, game);
  useImperativeHandle(ref, () => component, [component]);
};
