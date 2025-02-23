import { createContextStack, createDependTools, Dependency, Dependent } from "@anion155/shared";
import type { Signal } from "./signal";

const invalidate = Symbol.for("Signal#invalidate");

export interface SignalDependent extends Signal, Dependent {
  [invalidate](): void;
}
export interface SignalReadonlyDependency<Value> extends Signal, Dependency {
  get(): Value;
}
export interface SignalWritableDependency<Value> extends Signal, SignalReadonlyDependency<Value> {
  set(value: Value): void;
}

const { dependents, dependencies, bind, unbind } = createDependTools<
  SignalDependent,
  SignalReadonlyDependency<unknown> | SignalWritableDependency<unknown>
>();

const context = createContextStack<{ type: "empty" } | { type: "subscription"; dependent: SignalDependent }>({ type: "empty" });
function setupSubscriptionContext(dependent: SignalDependent) {
  return context.setup({ type: "subscription", dependent });
}

function handleSubscriptionContext(dependency: SignalReadonlyDependency<unknown> | SignalWritableDependency<unknown>) {
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
