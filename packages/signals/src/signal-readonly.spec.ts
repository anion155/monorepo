import { describe, expect, it } from "@jest/globals";

import { context, depends } from "./internals";
import { SignalReadonly } from "./signal-readonly";
import type { SignalDependentDependency, SignalListener, SignalValue } from "./types";

describe("class SignalReadonly", () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TestSignal<Value> extends SignalDependentDependency {}
  class TestSignal<Value> extends SignalReadonly<Value> implements SignalListener, SignalValue<Value> {
    constructor(value: Value, hasDependents = true) {
      super();
      depends.dependencies.stamp(this);
      if (hasDependents) depends.dependents.stamp(this);
      this.#current = value;
    }
    #current: Value;
    peak = () => this.#current;
    invalidate(): void {}
  }

  it(".subscribe() should subscribe listener in context to current signal", () => {
    const signalA = new TestSignal(0);
    const signalB = new TestSignal(1);
    const signalC = new TestSignal(2, false);
    using _subscription = context.setupSubscriptionContext(signalA);

    signalB.subscribe();
    expect(depends.rank(signalA, signalB)).toBe(1);

    signalC.subscribe();
    expect(depends.rank(signalA, signalC)).toBe(-1);
  });

  it(".get() should return current value", () => {
    expect(new TestSignal(0).get()).toBe(0);
  });

  it(".value should wrap .get() method", () => {
    const signalA = new TestSignal(0);
    const signalB = new TestSignal(1);
    using _subscription = context.setupSubscriptionContext(signalA);
    expect(signalB.value).toBe(1);
    expect(depends.rank(signalA, signalB)).toBe(1);
  });

  it(".toJSON() should handle JSON conversion", () => {
    const signal = new TestSignal({ value: 0 });
    expect(JSON.stringify(signal)).toBe('{"value":0}');
  });

  it(".valueOf() should return stored value", () => {
    const signal = new TestSignal(10);
    expect(0 + (signal as never as number)).toBe(10);
  });

  it(".toString() should create string from stored value", () => {
    const signal = new TestSignal([0, 1, 2]);
    using _subscription = context.setupSubscriptionContext(signal);
    expect(`value: ${signal as never as string}`).toBe(`value: 0,1,2`);
  });
});
