import { describe, expect, it } from "@jest/globals";

import { depends } from "./internals";
import { Signal } from "./signal";
import type { SignalDependentDependency, SignalListener, SignalValue } from "./types";

describe("class Signal", () => {
  interface TestSignal extends SignalDependentDependency {}
  class TestSignal extends Signal implements SignalListener, SignalValue<number> {
    constructor() {
      super();
      depends.dependencies.stamp(this);
      depends.dependents.stamp(this);
    }
    invalidate(): void {}
    peak = () => 5;
  }

  it("dependencies should be unbind on dispose", () => {
    const signalA = new TestSignal();
    const signalB = new TestSignal();
    depends.bind(signalA, signalB);
    expect(depends.rank(signalA, signalB)).toBe(1);
    signalA.dispose();
    expect(depends.rank(signalA, signalB)).toBe(-1);
  });

  it("dependents should be disposed on dispose", () => {
    const signalA = new TestSignal();
    const signalB = new TestSignal();
    depends.bind(signalA, signalB);
    signalB.dispose();
    expect(signalB.disposed).toBe(true);
  });
});
