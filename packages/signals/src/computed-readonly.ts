import "./internals/symbol";

import { defineToStringTag } from "@anion155/shared";

import { context, depends, SignalDependentDependency, SignalListener, SignalValue } from "./internals/internals";
import { SignalReadonly } from "./signal-readonly";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface SignalReadonlyComputed<Value> extends SignalDependentDependency {}
export class SignalReadonlyComputed<Value> extends SignalReadonly<Value> implements SignalValue<Value>, SignalListener {
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

  [Symbol.invalidate]() {
    using _subscription = context.setupSubscriptionContext(this);
    this.#current = this.#getter();
  }
}
defineToStringTag(SignalReadonlyComputed);
