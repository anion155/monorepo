import { describe, expect, it, jest } from "@jest/globals";

import { context, depends } from "./internals";
import { SignalWritable } from "./signal-writable";
import type { SignalDependentDependency, SignalListener, SignalValue } from "./types";

describe("class SignalWritable", () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TestSignal<Value> extends SignalDependentDependency {}
  class TestSignal<Value> extends SignalWritable<Value> implements SignalListener, SignalValue<Value> {
    constructor(value: Value, hasDependents = true) {
      super();
      depends.dependencies.stamp(this);
      if (hasDependents) depends.dependents.stamp(this);
      this.#current = value;
    }
    #current: Value;
    peak = () => this.#current;
    invalidate = jest.fn();
    set = (next: Value) => {
      this.#current = next;
    };
  }

  it(".value should wrap .get() and .set() methods", () => {
    const signalA = new TestSignal(0);
    const signalB = new TestSignal(1);
    const signalC = new TestSignal(2, false);
    const _subscription = context.setupSubscriptionContext(signalA);

    expect(signalB.value).toBe(1);
    expect(depends.rank(signalA, signalB)).toBe(1);

    expect(signalC.value).toBe(2);
    expect(depends.rank(signalA, signalC)).toBe(-1);

    _subscription[Symbol.dispose]();

    signalA.value = 3;
    expect(signalA.value).toBe(3);
  });

  it(".update() should call .set() with value modified from current", () => {
    const signalA = new TestSignal(5);
    signalA.update((v) => v * 2);
    expect(signalA.peak()).toBe(10);
  });
});
