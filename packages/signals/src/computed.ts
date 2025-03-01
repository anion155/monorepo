import { DependentDependency } from "@anion155/shared";

import { internals, SignalListener, SignalReadonlyValue } from "./internals";
import { Signal } from "./signal";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface SignalComputed<Value> extends DependentDependency {}
export class SignalComputed<Value> extends Signal implements SignalListener, SignalReadonlyValue<Value> {
  #current!: Value;
  #getter: () => Value;
  #setter?: (value: Value) => void;

  constructor(getter: () => Value, setter?: (value: Value) => void) {
    super();
    internals.dependencies.stamp(this);
    internals.dependents.stamp(this);
    this.#getter = getter;
    this.#setter = setter;
    this[internals.invalidate]();
  }

  peak() {
    return this.#current;
  }
  get() {
    internals.handleSubscriptionContext(this);
    return this.#current;
  }
  set(value: Value) {
    if (!this.#setter) throw new TypeError("this computed signal is readonly");
    this.#setter(value);
    this.#current = value;
    internals.dependents.get(this).forEach((dependent) => dependent[internals.invalidate]());
  }
  [internals.invalidate]() {
    using _subscription = internals.setupSubscriptionContext(this);
    this.#current = this.#getter();
    internals.dependents.get(this).forEach((dependent) => dependent[internals.invalidate]());
  }
}
