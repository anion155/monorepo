import { DependentDependency } from "@anion155/shared";
import { internals, SignalDependent, SignalReadonlyDependency } from "./internals";
import { Signal } from "./signal";

export interface SignalComputed<Value> extends DependentDependency {}
export class SignalComputed<Value> extends Signal implements SignalDependent, SignalReadonlyDependency<Value> {
  #current!: Value;
  #compute: () => Value;

  constructor(compute: () => Value) {
    super();
    internals.dependencies.stamp(this);
    internals.dependents.stamp(this);
    this.#compute = compute;
    this[internals.invalidate]();
  }

  get() {
    internals.handleSubscriptionContext(this);
    return this.#current;
  }
  [internals.invalidate]() {
    using subscription = internals.setupSubscriptionContext(this);
    this.#current = this.#compute();
    internals.dependents.get(this).forEach((dependent) => dependent[internals.invalidate]());
  }
}
