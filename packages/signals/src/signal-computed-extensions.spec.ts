import "./signal-computed-extensions";

import { describe, expect, it } from "@jest/globals";

import { SignalReadonlyComputed } from "./computed-readonly";
import { SignalWritableComputed } from "./computed-writable";
import { depends } from "./internals";
import { SignalReadonly } from "./signal-readonly";
import type { SignalDependentDependency, SignalListener, SignalValue } from "./types";

describe("SignalReadonly extensions", () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TestSignal<Value> extends SignalDependentDependency {}
  class TestSignal<Value> extends SignalReadonly<Value> implements SignalListener, SignalValue<Value> {
    constructor(value: Value, isDependency = true) {
      super();
      depends.dependencies.stamp(this);
      if (isDependency) depends.dependents.stamp(this);
      this.#current = value;
    }
    #current: Value;
    peak = () => this.#current;
    set = (next: Value) => {
      this.#current = next;
    };
    invalidate(): void {}
  }

  it(".map() should create SignalReadonlyComputed using project function", () => {
    const source = new TestSignal({ value: 5 });
    const target = source.map(({ value }) => value * 2);
    expect(target).toBeInstanceOf(SignalReadonlyComputed);
    expect(target.get()).toBe(10);
    source.set({ value: 6 });
    target.invalidate();
    expect(target.get()).toBe(12);
  });

  it(".field() should create SignalWritableComputed of specific field", () => {
    const source = new TestSignal({ value: 5 });
    const target = source.field("value");
    expect(target).toBeInstanceOf(SignalWritableComputed);
    expect(target).toBe(source.field("value"));

    expect(target.get()).toBe(5);
    source.set({ value: 6 });
    target.invalidate();
    expect(target.get()).toBe(6);
    target.set(7);
    expect(source.get()).toStrictEqual({ value: 7 });
  });
});
