import { DeveloperError, hasTypedField, isDisposable, isIterable } from "@anion155/shared";
import type { AnyEventsMap } from "@anion155/shared/event-emitter";
import { OrderedMap } from "@anion155/shared/ordered-map";
import { nanoid } from "nanoid/non-secure";

import { Resource } from "./resource";

export type EntityParams = {
  name?: string;
  parent?: IEntityHolder | null;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class Entity<Events extends AnyEventsMap<never> = any> extends Resource<void, Events> {
  readonly name: string;

  #parent!: IEntityHolder | null;
  get parent() {
    return this.#parent;
  }
  set parent(parent: IEntityHolder | null) {
    if (this.initializer.initialized) throw new DeveloperError("Already initialized");
    this.#parent = parent;
    parent?.append(this);
  }

  constructor(
    { name = nanoid(), parent = null }: EntityParams,
    initialize?: (stack: AsyncDisposableStack) => Promise<void> | void,
    preinit?: (stack: AsyncDisposableStack) => Promise<void> | void,
  ) {
    super(async (stack) => {
      await preinit?.(stack);
      for (const component of this.#components) {
        if (hasTypedField(component, "initialize", "function")) {
          await component.initialize();
        }
        if (isDisposable(component) || isDisposable.async(component)) {
          stack.append(component);
        }
      }
      await initialize?.(stack);
    });
    this.name = name;
    this.parent = parent;
  }

  #components = new Set<IEntityComponent>();
  registerComponent(component: IEntityComponent) {
    this.#components.add(component);
  }
  *eachComponents<T extends Constructable<never, unknown>>(type: T, name?: string) {
    for (const component of this.#components) {
      if (component.name && name && component.name !== name) continue;
      if (component instanceof type) yield component as InferConstructable<T>["Instance"];
    }
  }
  findComponent<T extends Constructable<never, unknown>>(type: T, name?: string) {
    for (const component of this.eachComponents(type, name)) {
      return component;
    }
    return undefined;
  }
}

export interface IEntityHolder {
  readonly children: OrderedMap<string, Entity>;
  [Symbol.iterator](): Iterable<Entity>;
  each(): Iterable<Entity>;
  append(entity: Entity): this;
  eachNestedComponents<T extends Constructable<never, unknown>>(type: T): Iterable<InferConstructable<T>["Instance"]>;
}
export class EntityHolder<Events extends AnyEventsMap<never> = Record<never, unknown>> extends Entity<Events> implements IEntityHolder {
  readonly children = new OrderedMap<string, Entity>();

  constructor(
    params: EntityParams,
    initialize?: (stack: AsyncDisposableStack) => Promise<void> | void,
    preinit?: (stack: AsyncDisposableStack) => Promise<void> | void,
  ) {
    super(params, async (stack) => {
      await preinit?.(stack);
      for (const child of this.children.values()) {
        stack.append(await child.initialize());
      }
      await initialize?.(stack);
    });
  }

  *[Symbol.iterator]() {
    const queue: Entity[] = [...this.children.values()];
    while (queue.length > 0) {
      const entity = queue.shift()!;
      yield entity;
      if (isIterable(entity)) queue.push(...(entity as Iterable<Entity>));
    }
  }
  each(): Iterable<Entity> {
    return this[Symbol.iterator]();
  }
  append(entity: Entity): this {
    this.children.push(entity.name, entity);
    return this;
  }
  *eachNestedComponents<T extends Constructable<never, unknown>>(type: T): Generator<InferConstructable<T>["Instance"]> {
    for (const entity of this) {
      if (entity.initializer.state.status !== "resolved") continue;
      yield* entity.eachComponents(type);
    }
  }
}

export type IEntityComponent = {
  readonly entity?: Entity;
  readonly name?: string;
  initialize?: () => unknown;
  [Symbol.dispose]?: () => void;
  [Symbol.asyncDispose]?: () => void;
};
export type EntityComponentParams = { entity: Entity; name?: string };
export abstract class EntityComponent<Value, Events extends AnyEventsMap<never> = Record<never, unknown>>
  extends Resource<Value, Events>
  implements IEntityComponent
{
  readonly entity: Entity;
  readonly name: string;

  constructor({
    entity,
    name = nanoid(),
    initialize,
  }: EntityComponentParams &
    IfEquals<
      Value,
      void,
      { initialize?: (stack: AsyncDisposableStack) => Promise<Value> | Value },
      { initialize: (stack: AsyncDisposableStack) => Promise<Value> | Value }
    >) {
    super((stack) => initialize?.(stack) as never);
    this.entity = entity;
    this.name = name;
    entity.registerComponent(this);
  }
}
