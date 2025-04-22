import { defineMethod, defineToStringTag, Stamper } from "@anion155/shared";

import { context, depends } from "./internals";
import { SignalReadonly } from "./signal-readonly";
import type { SignalDependentDependency, SignalListener, SignalValue } from "./types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface SignalReadonlyComputed<Value> extends SignalDependentDependency {}
/**
 * Computed Signal, can be used as computed readonly state.
 *
 * @example
 * const state = new SignalState(5);
 * const stateSin = new SignalReadonlyComputed(() => Math.sin(state.value));
 */
export class SignalReadonlyComputed<Value> extends SignalReadonly<Value> implements SignalValue<Value>, SignalListener {
  #current!: Value;
  #getter: () => Value;

  constructor(getter: () => Value) {
    super();
    depends.dependencies.stamp(this);
    depends.dependents.stamp(this);
    this.#getter = getter;
    this.invalidate();
  }

  peak() {
    return this.#current;
  }

  invalidate() {
    using _subscription = context.setupSubscriptionContext(this);
    this.#current = this.#getter();
  }
}
defineToStringTag(SignalReadonlyComputed);

declare module "./signal-readonly" {
  interface SignalReadonly<Value> {
    /** Creates {@link SignalReadonlyComputed} that projects from current signal. */
    map<Computed>(project: (value: Value) => Computed): SignalReadonlyComputed<Computed>;
    /** Creates {@link SignalReadonlyComputed} that get value from current value on {@link field} */
    view<Field extends Value extends object ? keyof Value : never>(field: Field): SignalReadonlyComputed<Value[Field]>;
  }
}
defineMethod(SignalReadonly.prototype, "map", function map<Value, Computed>(this: SignalReadonly<Value>, project: (value: Value) => Computed) {
  return new SignalReadonlyComputed<Computed>(() => project(this.get()));
});
const views = new Stamper((signal: SignalReadonly<unknown>) => {
  return Map.withFabric((field) => {
    return new SignalReadonlyComputed(() => {
      const value = signal.get();
      return Reflect.get(value as never, field as never, value);
    });
  });
});
defineMethod(SignalReadonly.prototype, "view", function view<Value, Field extends keyof Value>(this: SignalReadonly<Value>, field: Field) {
  if (!views.has(this)) views.stamp(this);
  return views.get(this as never).emplace(field);
});
