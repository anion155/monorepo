import { defineToStringTag } from "@anion155/shared";

import { context, depends } from "./internals";
import { SignalReadonly } from "./signal-readonly";
import type { SignalDependentDependency, SignalListener, SignalValue } from "./types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface SignalReadonlyComputed<Value> extends SignalDependentDependency {}
/**
 * Computed Signal, can be used as computed readonly state.
 *
 * @example
 *  const state = new SignalState(5);
 *  const stateSin = new SignalReadonlyComputed(() => Math.sin(state.value));
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
