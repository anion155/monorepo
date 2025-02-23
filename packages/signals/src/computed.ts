import { DependentDependency } from "@anion155/shared";
import { internals, SignalDependent, SignalReadonlyDependency } from "./internals";
import { Signal } from "./signal";

export interface SignalComputed<Value> extends DependentDependency {}
export class SignalComputed<Value> extends Signal implements SignalDependent, SignalReadonlyDependency<Value> {
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
    using subscription = internals.setupSubscriptionContext(this);
    this.#current = this.#getter();
    internals.dependents.get(this).forEach((dependent) => dependent[internals.invalidate]());
  }
}
