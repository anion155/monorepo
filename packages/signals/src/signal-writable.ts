import { defineToStringTag } from "@anion155/shared";

import { SignalReadonly } from "./signal-readonly";

/** Value Signal implementation of write methods. */
export abstract class SignalWritable<Value> extends SignalReadonly<Value> {
  abstract set(next: Value): void;

  get value() {
    return this.get();
  }
  set value(next: Value) {
    this.set(next);
  }

  update(modifier: (current: Value) => Value) {
    this.set(modifier(this.peak()));
  }
}
defineToStringTag(SignalWritable);
