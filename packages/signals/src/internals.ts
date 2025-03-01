import { createContextStack, createDependTools, Dependency, Dependent } from "@anion155/shared";

import type { Signal } from "./signal";

const invalidate = Symbol.for("Signal#invalidate");

export interface SignalListener extends Signal, Dependent {
  [invalidate](): void;
}
export interface SignalReadonlyValue<Value> extends Signal, Dependency {
  peak(): Value;
  get(): Value;
}
export interface SignalWritableValue<Value> extends Signal, SignalReadonlyValue<Value> {
  set(value: Value): void;
}

const { dependents, dependencies, bind, unbind } = createDependTools<SignalListener, SignalReadonlyValue<unknown> | SignalWritableValue<unknown>>();

const context = createContextStack<{ type: "empty" } | { type: "subscription"; dependent: SignalListener }>({ type: "empty" });
function setupSubscriptionContext(dependent: SignalListener) {
  return context.setup({ type: "subscription", dependent });
}

function handleSubscriptionContext(dependency: SignalReadonlyValue<unknown> | SignalWritableValue<unknown>) {
  const current = context.current();
  if (current.type === "subscription") {
    bind(current.dependent, dependency);
  }
}

export type PromiseCancelable<T> = Promise<T> & { cancel(reason?: unknown): void };

function asynchronizeInvalidate<Target extends { [invalidate](): void }>(target: Target) {
  const method = target[invalidate];
  let state: PromiseCancelable<void> | undefined;
  target[invalidate] = () => {
    if (state) return;
    const controller = new AbortController();
    const promise = Promise.resolve().then(() => {
      if (controller.signal.aborted) return;
      state = undefined;
      method.call(target);
    });
    state = Object.assign(promise, {
      cancel: (reason?: unknown) => {
        state = undefined;
        controller.abort(reason);
      },
    });
  };
  return { sync: method.bind(target), cancel: (reason?: unknown) => state?.cancel(reason) };
}

export const internals = {
  invalidate,
  dependents,
  dependencies,
  bind,
  unbind,
  setupSubscriptionContext,
  handleSubscriptionContext,
  asynchronizeInvalidate,
} as const;
