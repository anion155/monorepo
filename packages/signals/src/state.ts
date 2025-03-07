import { Dependency } from "@anion155/shared";

import { context, depends } from "./internals/internals";
import { SignalWritableValue } from "./internals/types";
import { Signal } from "./signal";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface SignalState<Value> extends Dependency {}
export class SignalState<Value> extends Signal implements SignalWritableValue<Value> {
  #current: Value;

  constructor(initialValue: Value) {
    super();
    depends.listeners.stamp(this);
    this.#current = initialValue;
  }

  peak() {
    return this.#current;
  }
  get() {
    context.handleSubscriptionContext(this);
    return this.#current;
  }
  set(value: Value) {
    this.#current = value;
    using batching = context.setupBatchingContext();
    batching.invalidate(this);
  }
}
