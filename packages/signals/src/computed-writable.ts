import { createErrorClass, defineToStringTag } from "@anion155/shared";

import { context, depends } from "./internals";
import { SignalWritable } from "./signal-writable";
import type { SignalDependentDependency, SignalListener, SignalValue } from "./types";

export class SignalReadonlyError extends createErrorClass("SignalReadonlyError") {}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface SignalWritableComputed<Value> extends SignalDependentDependency {}
/**
 * By-directional computed Signal, that can be used as computed writable state.
 *
 * @example
 * const state = new SignalState(5);
 * const stateSin = new SignalWritableComputed(
 *   () => Math.sin(state.value),
 *   sin => state.set(Math.asin(sin)),
 * );
 */
export class SignalWritableComputed<Value> extends SignalWritable<Value> implements SignalValue<Value>, SignalListener {
  #current!: Value;
  #getter: () => Value;
  #setter: (value: Value) => void;

  constructor(getter: () => Value, setter: (value: Value) => void) {
    super();
    depends.dependencies.stamp(this);
    depends.dependents.stamp(this);
    this.#getter = getter;
    this.#setter = setter;
    this.invalidate();
  }

  peak() {
    return this.#current;
  }
  protected _set(value: Value) {
    if (value === this.#current) return;
    this.#current = value;
    using batching = context.setupBatchingContext();
    batching.invalidate(this);
    this.#setter(value);
  }

  invalidate() {
    using _subscription = context.setupSubscriptionContext(this);
    this.#current = this.#getter();
  }
}
defineToStringTag(SignalWritableComputed);
