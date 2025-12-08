import { defineToStringTag } from "@anion155/shared";

import { SignalReadonly } from "./signal-readonly";

/** Value Signal implementation of write methods. */
export abstract class SignalWritable<Value, SetValueArg = never> extends SignalReadonly<Value> {
  protected abstract _set(next: Value | SetValueArg): void;

  get value(): Value {
    this.subscribe();
    return this.peak();
  }
  set value(next: Value | SetValueArg) {
    this._set(next);
  }

  update(modifier: (current: Value) => Value | SetValueArg) {
    this._set(modifier(this.peak()));
  }
}
defineToStringTag(SignalWritable);
