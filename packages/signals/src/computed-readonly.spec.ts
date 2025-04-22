import { describe, expect, it } from "@jest/globals";

import { SignalReadonlyComputed } from "./computed-readonly";
import { context, depends } from "./internals";
import { Signal } from "./signal";
import { SignalReadonly } from "./signal-readonly";
import type { SignalDependentDependency, SignalListener, SignalValue } from "./types";

describe("class SignalReadonlyComputed", () => {
  it("should create dependable signal with dependencies", () => {
    const signal = new SignalReadonlyComputed(() => 5);
    expect(signal).toBeInstanceOf(Signal);
    expect(depends.dependencies.has(signal)).toBe(true);
    expect(depends.dependents.has(signal)).toBe(true);
    expect(signal.peak()).toBe(5);
  });

  it("should call getter with subscription context", () => {
    new SignalReadonlyComputed(() => {
      expect(context.current()).toStrictEqual({ type: "subscription", listener: expect.any(Signal) });
      return 5;
    });
    expect.assertions(1);
  });
});

describe("SignalReadonly extensions", () => {
  interface TestSignal extends SignalDependentDependency {}
  class TestSignal extends SignalReadonly<{ value: number }> implements SignalListener, SignalValue<{ value: number }> {
    constructor() {
      super();
      depends.dependencies.stamp(this);
      depends.dependents.stamp(this);
    }
    #value = { value: 5 };
    peak = () => this.#value;
    set = (next: { value: number }) => {
      this.#value = next;
    };
    invalidate(): void {}
  }

  it(".map() should create SignalReadonlyComputed using project function", () => {
    const source = new TestSignal();
    const target = source.map(({ value }) => value * 2);
    expect(target).toBeInstanceOf(SignalReadonlyComputed);
    expect(target.get()).toBe(10);
    source.set({ value: 6 });
    target.invalidate();
    expect(target.get()).toBe(12);
  });

  it(".view() should create SignalReadonlyComputed of specific field", () => {
    const source = new TestSignal();
    const target = source.view("value");
    expect(target).toBeInstanceOf(SignalReadonlyComputed);
    expect(target.get()).toBe(5);
    source.set({ value: 6 });
    target.invalidate();
    expect(target.get()).toBe(6);
  });
});
