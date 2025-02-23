import { Dependency } from "@anion155/shared";
import { internals, SignalWritableDependency } from "./internals";
import { Signal } from "./signal";

export interface SignalState<Value> extends Dependency {}
export class SignalState<Value> extends Signal implements SignalWritableDependency<Value> {
  #current: Value;

  constructor(initialValue: Value) {
    super();
    internals.dependents.stamp(this);
    this.#current = initialValue;
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
