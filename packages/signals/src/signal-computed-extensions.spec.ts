import "./signal-computed-extensions";

import { describe, expect, it } from "@jest/globals";

import { SignalReadonlyComputed } from "./computed-readonly";
import { SignalWritableComputed } from "./computed-writable";
import { depends } from "./internals";
import { SignalWritable } from "./signal-writable";
import type { SignalDependentDependency, SignalListener, SignalValue } from "./types";

describe("SignalReadonly extensions", () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TestSignal<Value> extends SignalDependentDependency {}
  class TestSignal<Value> extends SignalWritable<Value> implements SignalListener, SignalValue<Value> {
    constructor(value: Value, isDependency = true) {
      super();
      depends.dependencies.stamp(this);
      if (isDependency) depends.dependents.stamp(this);
      this.#current = value;
    }
    #current: Value;
    peak = () => this.#current;
    _set = (next: Value) => {
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

  it(".view() should create SignalReadonlyComputed of specific field", () => {
    const source = new TestSignal({ value: 5 });
    const target = source.view("value");
    expect(target).toBeInstanceOf(SignalReadonlyComputed);
    expect(target).toBe(source.view("value"));

    expect(target.get()).toBe(5);
    source.set({ value: 6 });
    target.invalidate();
    expect(target.get()).toBe(6);
  });

  it(".view() should create nested view", () => {
    const source = new TestSignal({ a: { b: { c: 0 } } });
    const target = source.view("a", "b", "c");
    expect(target).toBeInstanceOf(SignalReadonlyComputed);
    expect(target).toBe(source.view("a", "b", "c"));
    expect(target.get()).toBe(0);
  });

  it(".view() should create readonly version of signal", () => {
    const source = new TestSignal("test");
    const target = source.view();
    expect(target).toBeInstanceOf(SignalReadonlyComputed);
    expect(target).toBe(source.view());
    expect(target.get()).toBe("test");
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

  it(".field() should create nested field", () => {
    const source = new TestSignal({ a: { b: { c: 0 } } });
    const target = source.field("a", "b", "c");
    expect(target).toBeInstanceOf(SignalWritableComputed);
    expect(target).toBe(source.field("a", "b", "c"));
    expect(target.get()).toBe(0);
    target.set(5);
    expect(source.get()).toStrictEqual({ a: { b: { c: 5 } } });
  });

  it(".field() type should fail readonly field", () => {
    const source = new TestSignal<{ readonly value: number }>({ value: 5 });
    // @ts-expect-error(2345) - should fail on type evaluation
    source.field("value");
  });

  it(".get() should return nested value", () => {
    const signal = new TestSignal({ a: { b: { c: 0 } } });
    expect(signal.get()).toStrictEqual({ a: { b: { c: 0 } } });
    expect(signal.get("a")).toStrictEqual({ b: { c: 0 } });
    expect(signal.get("a", "b")).toStrictEqual({ c: 0 });
    expect(signal.get("a", "b", "c")).toStrictEqual(0);
  });

  it(".set() should set nested value", () => {
    const signal = new TestSignal({ a: { b: { c: 0 } } });
    signal.set({ a: { b: { c: 1 } } });
    expect(signal.get("a", "b", "c")).toBe(1);
    signal.set({ b: { c: 2 } }, "a");
    expect(signal.get("a", "b", "c")).toBe(2);
    signal.set({ c: 3 }, "a", "b");
    expect(signal.get("a", "b", "c")).toBe(3);
    signal.set(4, "a", "b", "c");
    expect(signal.get("a", "b", "c")).toBe(4);
  });

  it(".set() type should fail on readonly field", () => {
    const signal = new TestSignal<{ a: { readonly b: { c: number } } }>({ a: { b: { c: 0 } } });
    signal.set({ a: { b: { c: 1 } } });
    signal.set({ b: { c: 2 } }, "a");
    // @ts-expect-error(2345) - should fail on type evaluation
    signal.set({ c: 3 }, "a", "b");
    // @ts-expect-error(2345) - should fail on type evaluation
    signal.set(4, "a", "b", "c");
  });
});
