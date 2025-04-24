import { defineToStringTag } from "@anion155/shared";

import { SignalReadonly } from "./signal-readonly";

/** Value Signal implementation of write methods. */
export abstract class SignalWritable<Value> extends SignalReadonly<Value> {
  protected abstract _set(next: Value): void;

  get value() {
    this.subscribe();
    return this.peak();
  }
  set value(next: Value) {
    this._set(next);
  }

  update(modifier: (current: Value) => Value) {
    this._set(modifier(this.peak()));
  }
}
defineToStringTag(SignalWritable);
