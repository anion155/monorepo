import "./signal-computed-extensions";

import { describe, expect, it } from "@jest/globals";

import { SignalBinding } from "./binding";
import { depends } from "./internals";
import { Signal } from "./signal";

describe("class SignalBinding", () => {
  it("should create bindable signal", () => {
    const signalA = new SignalBinding(1);
    expect(signalA).toBeInstanceOf(Signal);
    expect(depends.dependencies.has(signalA)).toBe(true);
    expect(depends.dependents.has(signalA)).toBe(true);
    expect(signalA.peak()).toBe(1);

    const signalB = new SignalBinding(() => signalA.value * 2);
    expect(signalB.peak()).toBe(2);
  });

  it("should handle bindings", () => {
    const signalA = new SignalBinding(1);
    const signalB = new SignalBinding(() => signalA.value * 2);

    signalA.value = 2;
    expect(signalB.peak()).toBe(4);

    const compute = () => signalA.value * 3;
    signalB.bind(compute);
    expect(signalB.peak()).toBe(6);

    signalB.bind(compute);
    expect(signalB.peak()).toBe(6);

    signalB.value = 6;
    expect(signalB.peak()).toBe(6);
  });

  it("should create bindable signal with parser", () => {
    const signalA = new SignalBinding<string, number>(1, (arg) => String(arg));
    expect(signalA.peak()).toBe("1");
    signalA.set(2);
    expect(signalA.peak()).toBe("2");
    signalA.value = 3;
    expect(signalA.value).toBe("3");
  });

  // eslint-disable-next-line jest/expect-expect
  it("should not invalidate if there is no binding", () => {
    const signalA = new SignalBinding(1);
    const signalB = new SignalBinding(1);
    depends.bind(signalA, signalB);
    signalB.value = 2;
  });
});
