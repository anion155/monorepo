import { Dependency } from "@anion155/shared";

import { internals, SignalWritableValue } from "./internals";
import { Signal } from "./signal";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface SignalState<Value> extends Dependency {}
export class SignalState<Value> extends Signal implements SignalWritableValue<Value> {
  #current: Value;

  constructor(initialValue: Value) {
    super();
    internals.dependents.stamp(this);
    this.#current = initialValue;
  }

  peak() {
    return this.#current;
  }
  get() {
    internals.handleSubscriptionContext(this);
    return this.#current;
  }
  set(value: Value) {
    this.#current = value;
    internals.dependents.get(this).forEach((dependent) => dependent[internals.invalidate]());
  }
}
