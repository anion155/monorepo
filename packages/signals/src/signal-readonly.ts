import { defineToStringTag } from "@anion155/shared";

import { context, depends } from "./internals";
import { Signal } from "./signal";

/** Value Signal implementation of read methods. */
export abstract class SignalReadonly<Value> extends Signal {
  abstract peak(): Value;

  subscribe() {
    if (depends.dependents.has(this)) context.handleSubscriptionContext(this);
  }

  get(): Value {
    this.subscribe();
    return this.peak();
  }

  get value(): Value {
    return this.get();
  }

  toJSON(): Value {
    return this.peak();
  }

  valueOf(): Value {
    return this.peak();
  }

  toString(): string {
    return String(this.peak());
  }
}
defineToStringTag(SignalReadonly);
