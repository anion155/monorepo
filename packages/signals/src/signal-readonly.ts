import { defineToStringTag } from "@anion155/shared";

import { context, depends } from "./internals/internals";
import { Signal } from "./signal";

export abstract class SignalReadonly<Value> extends Signal {
  abstract peak(): Value;

  get(): Value {
    if (depends.listeners.has(this)) context.handleSubscriptionContext(this);
    return this.peak();
  }

  get value(): Value {
    return this.get();
  }

  toJSON(): Value {
    return this.peak();
  }

  toString(): string {
    return String(this.peak());
  }
}
defineToStringTag(SignalReadonly);
