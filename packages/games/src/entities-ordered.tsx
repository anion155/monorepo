import { isTruthy } from "@anion155/shared";
import { OrderedMap } from "@anion155/shared/ordered-map";
import { useConst } from "@anion155/shared/react";
import { mergeRefs } from "@anion155/shared/react/merge-refs";
import type { ForwardedRef, ReactNode } from "react";
import { cloneElement, Fragment, isValidElement, useEffect, useImperativeHandle } from "react";

import type { IEntities } from "./entities";
import { EntitiesContext } from "./entities";
import { EntityController, useEntityParent } from "./entity";
import { passChildren } from "./pass-children";

export class EntitiesOrderedController extends EntityController implements IEntities {
  readonly #children = new OrderedMap<string, EntityController>();
  [Symbol.iterator](): Iterator<EntityController> {
    return this.#children.values;
  }
  getEntity(id: string): EntityController | undefined {
    return this.#children.get(id);
  }
  entityAt(index: number): EntityController | undefined {
    return this.#children.at(index);
  }
  appendEntity(child: EntityController): void {
    this.#children.push(child.name, child, true);
    child.parent = this;
  }
  setEntities(...children: EntityController[]): void {
    for (let index = 0; index < children.length; index += 1) {
      const child = children[index];
      this.#children.set(index, child.name, child);
      child.parent = this;
    }
    for (let index = children.length; index < this.#children.size; index += 1) {
      this.#children.at(index)!.parent = null;
    }
    this.#children.splice(children.length);
  }
  removeEntity(child: EntityController): void {
    child.parent = null;
    this.#children.delete(child.name);
  }
  clearEntities() {
    for (const [, child] of this.#children) {
      child.parent = null;
    }
    this.#children.clear();
  }
}

type EntitiesOrderedProps = {
  ref?: ForwardedRef<EntitiesOrderedController>;
  children?: ReactNode;
};

export const EntitiesOrdered = ({ ref, children }: EntitiesOrderedProps) => {
  const entities = useConst(() => new EntitiesOrderedController());
  useImperativeHandle(ref, () => entities, [entities]);
  useEntityParent(entities);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const array = [] as Array<EntityController | null>;
  const traverseNode = (node: ReactNode): ReactNode => {
    if (Array.isArray(node)) return node.map(traverseNode);
    if (!isValidElement(node)) return node;
    if (node.type === Fragment) return passChildren(node, traverseNode((node.props as { children: ReactNode }).children));
    const index = array.push(null) - 1;
    return cloneElement(node, {
      ref: mergeRefs((node.props as { ref?: ForwardedRef<EntityController> }).ref, (entity) => (array[index] = entity)),
    } as never);
  };
  children = traverseNode(children);
  useEffect(() => {
    entities.setEntities(...array.filter(isTruthy));
    return () => entities.clearEntities();
  }, [entities, array]);
  return passChildren(<EntitiesContext.Provider value={entities} />, children);
};
