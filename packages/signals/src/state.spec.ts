import "./signal-computed-extensions";

import { describe, expect, it, jest } from "@jest/globals";

import { context, depends } from "./internals";
import { Signal } from "./signal";
import { SignalState } from "./state";
import type { SignalDependent, SignalListener } from "./types";

describe("class SignalState", () => {
  interface TestSignal extends SignalDependent {}
  class TestSignal extends Signal implements SignalListener {
    invalidate = jest.fn();
  }

  it("should implement state signal", () => {
    const listener = new TestSignal();
    depends.dependencies.stamp(listener);
    using _subscription = context.setupSubscriptionContext(listener);

    const state = new SignalState(5);
    expect(state.get()).toBe(5);

    state.set(6);
    expect(listener.invalidate).toHaveBeenCalledTimes(1);
  });

  it("this.set() should not invalidate dependents if value wasn't changed", () => {
    const listener = new TestSignal();
    depends.dependencies.stamp(listener);
    using _subscription = context.setupSubscriptionContext(listener);

    const state = new SignalState(5);
    expect(state.get()).toBe(5);

    state.set(5);
    expect(listener.invalidate).toHaveBeenCalledTimes(0);
  });
});
