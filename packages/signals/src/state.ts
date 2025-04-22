import { defineToStringTag } from "@anion155/shared";

import { context, depends } from "./internals";
import { SignalWritable } from "./signal-writable";
import type { SignalDependency, SignalValue } from "./types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface SignalState<Value> extends SignalDependency {}
/** Signal that stores state */
export class SignalState<Value> extends SignalWritable<Value> implements SignalValue<Value> {
  #current: Value;

  constructor(initialValue: Value) {
    super();
    depends.dependents.stamp(this);
    this.#current = initialValue;
  }

  peak() {
    return this.#current;
  }
  set(value: Value) {
    if (value === this.#current) return;
    this.#current = value;
    using batching = context.setupBatchingContext();
    batching.invalidate(this);
  }
}
defineToStringTag(SignalState);
