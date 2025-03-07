import "./internals/symbol";

import { DependentDependency } from "@anion155/shared";

import { context, depends } from "./internals/internals";
import { SignalListener, SignalReadonlyValue, SignalWritableValue } from "./internals/types";
import { Signal } from "./signal";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface SignalReadonlyComputed<Value> extends DependentDependency {}
export class SignalReadonlyComputed<Value> extends Signal implements SignalListener, SignalReadonlyValue<Value> {
  #current!: Value;
  #getter: () => Value;

  constructor(getter: () => Value) {
    super();
    depends.dependencies.stamp(this);
    depends.listeners.stamp(this);
    this.#getter = getter;
    this[Symbol.invalidate]();
  }

  peak() {
    return this.#current;
  }
  get() {
    context.handleSubscriptionContext(this);
    return this.#current;
  }
  [Symbol.invalidate]() {
    using _subscription = context.setupSubscriptionContext(this);
    this.#current = this.#getter();
    this.#current = this.#getter();
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface SignalWritableComputed<Value> extends DependentDependency {}
export class SignalWritableComputed<Value> extends SignalReadonlyComputed<Value> implements SignalWritableValue<Value> {
  #setter: (value: Value) => void;

  constructor(getter: () => Value, setter: (value: Value) => void) {
    super(getter);
    this.#setter = setter;
  }

  set(value: Value) {
    using _batching = context.setupBatchingContext();
    this.#setter(value);
  }
}
