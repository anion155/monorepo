import { ignoreError } from "@anion155/shared";
import { describe, expect, it, jest } from "@jest/globals";

import { SignalWritableComputed } from "./computed-writable";
import type { SignalsContext } from "./internals";
import { context, depends } from "./internals";
import { Signal } from "./signal";

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
