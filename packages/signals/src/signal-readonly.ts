import { defineToStringTag } from "@anion155/shared";

import { context, depends } from "./internals";
import { Signal } from "./signal";

/** Value Signal implementation of read methods. */
export interface SignalReadonly<Value> {
  get(): Value; // implemented in signal-computed-extensions
}
export abstract class SignalReadonly<Value> extends Signal {
  abstract peak(): Value;

  /**
   * Subscribes current signal to listener in context
   *
   * @example
   *  const state = new SignalState(5);
   *  const effect = new SignalEffect(() => {
   *    state.subscribe();
   *    console.log('state changed');
   *  });
   */
  subscribe() {
    if (depends.dependents.has(this)) context.handleSubscriptionContext(this);
  }

  get value(): Value {
    this.subscribe();
    return this.peak();
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
