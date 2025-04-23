import { createContextStack, createDependTools } from "@anion155/shared";

import type { SignalDependency, SignalListener } from "./types";

export type SignalsContext =
  | { type: "empty" }
  | { type: "subscription"; listener: SignalListener; render?: boolean }
  | { type: "batching"; invalidate: (value: SignalDependency) => void };
const stack = createContextStack<SignalsContext>({ type: "empty" });

function setupSubscriptionContext(listener: SignalListener) {
  return stack.setup({ type: "subscription", listener });
}

function handleSubscriptionContext(dependency: SignalDependency) {
  const current = stack.current();
  if (current.type === "subscription") {
    depends.bind(current.listener, dependency);
  }
}

function setupBatchingContext() {
  const parent = stack.find((current) => current.type === "batching");
  if (parent) return stack.setup({ type: "batching", invalidate: parent.invalidate });
  const batched = new Set<SignalListener>();
  const invalidate = (value: SignalDependency) => {
    const queue = [] as SignalListener[];
    queue.push(...depends.dependents.get(value));
    while (queue.length) {
      const listener = queue.shift()!;
      batched.add(listener);
      depends.dependents.getSafe(listener)?.forEach((dep) => queue.push(dep));
    }
  };
  return stack.setup({ type: "batching", invalidate }, () => {
    batched.forEach((listener) => listener.invalidate());
  });
}

export const context = {
  ...stack,
  setupSubscriptionContext,
  handleSubscriptionContext,
  setupBatchingContext,
} as const;

export const depends = createDependTools<SignalListener, SignalDependency>();
