import { describe, expect, it } from "@jest/globals";

import { SignalReadonlyComputed } from "./computed-readonly";
import { context, depends } from "./internals";
import { Signal } from "./signal";

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
