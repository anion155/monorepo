import { DeveloperError, ignoreError } from "@anion155/shared";
import { describe, expect, it, jest } from "@jest/globals";

import { SignalWritableComputed } from "./computed-writable";
import type { SignalsContext } from "./internals";
import { context, depends } from "./internals";
import { Signal } from "./signal";
import { SignalWritable } from "./signal-writable";
import type { SignalDependentDependency, SignalListener, SignalValue } from "./types";

describe("class SignalWritableComputed", () => {
  class TestSignal extends SignalWritableComputed<number> {
    #current: number;
    getterSpy = jest.fn<(context: SignalsContext) => void>();
    setterSpy = jest.fn<(next: number) => void>();
    invalidate = jest.fn<() => void>(super.invalidate);

    constructor(value = 5) {
      super(
        ignoreError(
          ReferenceError,
          0,
        )(() => {
          this.getterSpy(context.current());
          return this.#current;
        }),
        (next) => {
          this.setterSpy(next);
          this.#current = next;
        },
      );
      this.#current = value;
      this.invalidate();
    }
  }

  it("should create dependable signal with dependencies", () => {
    const signal = new TestSignal();
    expect(signal).toBeInstanceOf(Signal);
    expect(depends.dependencies.has(signal)).toBe(true);
    expect(depends.dependents.has(signal)).toBe(true);
  });

  it("should wrap value", () => {
    const signal = new TestSignal();
    expect(signal.get()).toBe(5);
    expect(signal.getterSpy).toHaveBeenCalledWith({ type: "subscription", listener: expect.any(Signal) });
    signal.set(6);
    expect(signal.setterSpy).toHaveBeenCalledWith(6);
  });

  it("should invalidate listener", () => {
    const signal = new TestSignal();
    const listener = new TestSignal();
    listener.invalidate.mockClear();
    depends.bind(listener, signal);
    signal.set(6);
    expect(listener.invalidate).toHaveBeenCalledTimes(1);
  });

  it("should not invalidate listener if value is same as current", () => {
    const signal = new TestSignal();
    const listener = new TestSignal();
    listener.invalidate.mockClear();
    depends.bind(listener, signal);
    signal.set(5);
    expect(listener.invalidate).toHaveBeenCalledTimes(0);
  });
});

describe("SignalWritable extensions", () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TestSignal<Value> extends SignalDependentDependency {}
  class TestSignal<Value> extends SignalWritable<Value> implements SignalListener, SignalValue<Value> {
    #current: Value;
    constructor(value: Value, isDependency = true) {
      super();
      depends.dependencies.stamp(this);
      if (isDependency) depends.dependents.stamp(this);
      this.#current = value;
    }
    peak = () => this.#current;
    set = (next: Value) => {
      this.#current = next;
    };
    invalidate(): void {}
  }

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

  it(".proxy() should fail on non object value", () => {
    const source = new TestSignal(5);
    expect(() => source.proxy()).toStrictThrow(new TypeError("Cannot create proxy with a non-object as target or handler"));
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
