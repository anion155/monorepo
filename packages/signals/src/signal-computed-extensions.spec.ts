import "./signal-computed-extensions";

import { DeveloperError } from "@anion155/shared";
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

  describe(".snapshot()", () => {
    it("should create snapshot from stored value", () => {
      const source = new TestSignal({ a: 1, b: 1 });
      expect(source.snapshot()).toStrictEqual({ a: 1, b: 1 });
    });

    it("should return non object value", () => {
      const source = new TestSignal(1);
      expect(source.snapshot()).toBe(1);
    });

    it("should throw error signal isn't dependency", () => {
      class NotDependencyTestSignal extends SignalReadonly<number> {
        peak = () => 5;
      }
      const signal = new NotDependencyTestSignal();
      expect(() => signal.snapshot()).toStrictThrow(new DeveloperError("this signal does not support proxy call"));
    });

    it("should cache snapshot", () => {
      const source = new TestSignal({ a: 1 });
      const snapshot = source.snapshot();

      expect(snapshot).toBe(source.snapshot());
      source.set({ a: 2 });
      expect(snapshot).not.toBe(source.snapshot());

      expect(source.snapshot()).not.toBe(source.snapshot(new TestSignal(0)));
    });

    it("should subscribe to listener", () => {
      const source = new TestSignal({ a: 1, b: 1 });
      const listener = new TestSignal(0);
      const snapshot = source.snapshot(listener);

      expect(depends.rank(listener, source)).toBe(1);
      expect(depends.rank(listener, source.field("a"))).toBe(-1);
      expect(depends.rank(listener, source.field("b"))).toBe(-1);

      void snapshot.a;
      expect(depends.rank(listener, source)).toBe(1);
      expect(depends.rank(listener, source.field("a"))).toBe(1);
      expect(depends.rank(listener, source.field("b"))).toBe(-1);
    });
  });
});
