import { defineToStringTag } from "@anion155/shared";

import { context, depends, SignalDependency } from "./internals/internals";
import { SignalWritable } from "./signal-writable";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface SignalState<Value> extends SignalDependency {}
export class SignalState<Value> extends SignalWritable<Value> {
  #current: Value;

  constructor(initialValue: Value) {
    super();
    depends.listeners.stamp(this);
    this.#current = initialValue;
  }

  peak() {
    return this.#current;
  }
  set(value: Value) {
    this.#current = value;
    using batching = context.setupBatchingContext();
    batching.invalidate(this);
  }
}
defineToStringTag(SignalState);
