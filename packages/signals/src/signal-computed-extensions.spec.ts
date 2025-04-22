import "./signal-computed-extensions";

import { DeveloperError } from "@anion155/shared";
import { describe, expect, it } from "@jest/globals";

import { SignalReadonlyComputed } from "./computed-readonly";
import { SignalWritableComputed } from "./computed-writable";
import { context, depends } from "./internals";
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
    expect(target.get()).toBe(5);
    source.set({ value: 6 });
    target.invalidate();
    expect(target.get()).toBe(6);
  });

  it(".field() should create SignalWritableComputed of specific field", () => {
    const source = new TestSignal({ value: 5 });
    const target = source.field("value");
    expect(target).toBeInstanceOf(SignalWritableComputed);
    expect(target.get()).toBe(5);
    source.set({ value: 6 });
    target.invalidate();
    expect(target.get()).toBe(6);
    target.set(7);
    expect(source.get()).toStrictEqual({ value: 7 });
  });

  it(".proxy() should create Proxy object from inner value", () => {
    const source = new TestSignal({ value: 5 });
    expect(source.proxy()).toStrictEqual({ value: 5 });
  });

  it(".proxy() should subscribe listener to fields", () => {
    const source = new TestSignal({ value: 5 });
    const listener = new TestSignal(0);
    const proxy = source.proxy(listener);
    expect(proxy.value).toBe(5);
    expect(depends.rank(listener, source.field("value"))).toBe(1);
  });

  it(".proxy() should return nested proxy", () => {
    const source = new TestSignal({ box: { value: 5 } });
    const listener = new TestSignal(0);
    const proxy = source.proxy(listener);
    expect(proxy.box.value).toBe(5);
    expect(depends.rank(listener, source.field("box").field("value"))).toBe(1);
  });

  it(".proxy() should subscribe listener from context", () => {
    const source = new TestSignal({ value: 5 });
    const listener = new TestSignal(0);
    using _subsription = context.setupSubscriptionContext(listener);
    const proxy = source.proxy();
    expect(proxy.value).toBe(5);
    expect(depends.rank(listener, source.field("value"))).toBe(1);
  });

  it(".proxy() should fail on non dependency signal", () => {
    const source = new TestSignal(5, false);
    expect(() => source.proxy()).toStrictThrow(new DeveloperError("this signal does not support proxy call"));
  });

  it(".proxy() should bew able to set field value", () => {
    const source = new TestSignal({ value: 5 });
    source.proxy().value = 6;
    expect(source.get()).toStrictEqual({ value: 6 });
  });

  it(".proxy() should implement all traps with current value", () => {
    /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
    const source = new TestSignal({ value: 5 } as any);

    expect("value" in source.proxy()).toBe(true);
    expect("unknown" in source.proxy()).toBe(false);
    source.set({ unknown: 5 });
    expect("value" in source.proxy()).toBe(false);
    expect("unknown" in source.proxy()).toBe(true);
    source.set({ value: 5 });

    Object.defineProperty(source.proxy(), "unknown", { value: 1, enumerable: true, configurable: true });
    expect("unknown" in source.proxy()).toBe(true);
    delete source.proxy().unknown;

    expect(Object.getOwnPropertyDescriptor(source.proxy(), "value")).toStrictEqual({
      value: 5,
      writable: true,
      enumerable: true,
      configurable: true,
    });

    expect(Object.isExtensible(source.proxy())).toBe(true);
    Object.preventExtensions(source.proxy());
    expect(Object.isExtensible(source.get())).toBe(false);
    source.set({ value: 5 });

    expect(Object.getPrototypeOf(source.proxy())).toBe(Object.prototype);
    Object.setPrototypeOf(source.proxy(), null);
    expect(Object.getPrototypeOf(source.get())).toBe(null);

    source.set((a: number) => `test-${a}`);
    expect(source.proxy()(1)).toBe("test-1");
    source.set(function (this: number, a: number) {
      return `test-${a}-${this}`;
    });
    expect(source.proxy().call(1, 2)).toBe("test-2-1");

    class Test {}
    source.set(Test);
    expect(new (source.proxy())()).toBeInstanceOf(Test);
    /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
  });

  it(".proxy() should handle signal not having #fields on delete property", () => {
    expect(() => {
      /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */
      const source = new TestSignal({ value: 5 } as any);
      delete source.proxy().unknown;
      /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */
    }).not.toThrow();
  });
});
