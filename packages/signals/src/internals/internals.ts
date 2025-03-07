import { createContextStack, createDependTools } from "@anion155/shared";

import { SignalListener, SignalValue } from "./types";

const stack = createContextStack<
  { type: "empty" } | { type: "subscription"; listener: SignalListener } | { type: "batching"; invalidate: (value: SignalValue<unknown>) => void }
>({ type: "empty" });

function setupSubscriptionContext(listener: SignalListener) {
  return stack.setup({ type: "subscription", listener });
}

function handleSubscriptionContext(dependency: SignalValue<unknown>) {
  const current = stack.current();
  if (current.type === "subscription") {
    bind(current.listener, dependency);
  }
}

function setupBatchingContext() {
  const parent = stack.find((current) => current.type === "batching");
  if (parent) return stack.setup({ type: "batching", invalidate: parent.invalidate });
  const batched = new Set<SignalListener>();
  const invalidate = (value: SignalValue<unknown>) => {
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

const { dependents: listeners, dependencies, bind, unbind } = createDependTools<SignalListener, SignalValue<unknown>>();

export const depends = {
  listeners,
  dependencies,
  bind,
  unbind,
} as const;
