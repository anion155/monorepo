import "./internals/symbol";

import { createErrorClass, defineToStringTag } from "@anion155/shared";

import { context, depends, SignalDependentDependency, SignalListener, SignalValue } from "./internals/internals";
import { SignalWritable } from "./signal-writable";

export class SignalReadonlyError extends createErrorClass("SignalReadonlyError") {}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface SignalWritableComputed<Value> extends SignalDependentDependency {}
export class SignalWritableComputed<Value> extends SignalWritable<Value> implements SignalValue<Value>, SignalListener {
  #current!: Value;
  #getter: () => Value;
  #setter: (value: Value) => void;

  constructor(getter: () => Value, setter: (value: Value) => void) {
    super();
    depends.dependencies.stamp(this);
    depends.listeners.stamp(this);
    this.#getter = getter;
    this.#setter = setter;
    this[Symbol.invalidate]();
  }

  peak() {
    return this.#current;
  }
  set(value: Value) {
    using _batching = context.setupBatchingContext();
    this.#setter(value);
  }

  [Symbol.invalidate]() {
    using _subscription = context.setupSubscriptionContext(this);
    this.#current = this.#getter();
  }
}
defineToStringTag(SignalWritableComputed);
