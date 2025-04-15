import "./symbol";

import { createContextStack, createDependTools, Dependency, Dependent } from "@anion155/shared";

import { Signal } from "../signal";

export interface SignalDependent extends Signal, Dependent {}
export interface SignalListener extends SignalDependent {
  [Symbol.invalidate](): void;
}
export interface SignalDependency extends Signal, Dependency {}
export interface SignalValue<Value> extends SignalDependency {
  peak(): Value;
}
export type SignalDependentDependency = Signal & Dependent & Dependency;

const stack = createContextStack<
  { type: "empty" } | { type: "subscription"; listener: SignalListener } | { type: "batching"; invalidate: (value: SignalDependency) => void }
>({ type: "empty" });

function setupSubscriptionContext(listener: SignalListener) {
  return stack.setup({ type: "subscription", listener });
}

function handleSubscriptionContext(dependency: SignalDependency) {
  const current = stack.current();
  if (current.type === "subscription") {
    bind(current.listener, dependency);
  }
}

function setupBatchingContext() {
  const parent = stack.find((current) => current.type === "batching");
  if (parent) return stack.setup({ type: "batching", invalidate: parent.invalidate });
  const batched = new Set<SignalListener>();
  const invalidate = (value: SignalDependency) => {
    const queue = [] as SignalListener[];
    queue.push(...listeners.get(value));
    while (queue.length) {
      const listener = queue.shift()!;
      batched.add(listener);
      listeners.getSafe(listener)?.forEach((dep) => queue.push(dep));
    }
  };
  return stack.setup({ type: "batching", invalidate }, () => {
    batched.forEach((listener) => listener[Symbol.invalidate]());
  });
}

export const context = {
  setupSubscriptionContext,
  handleSubscriptionContext,
  setupBatchingContext,
} as const;

const { dependents: listeners, dependencies, bind, unbind } = createDependTools<SignalListener, SignalDependency>();

export const depends = {
  listeners,
  dependencies,
  bind,
  unbind,
} as const;
