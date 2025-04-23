import "../signal-computed-extensions";

import { act, renderHook } from "@anion155/shared/react";
import { describe, expect, it } from "@jest/globals";

import { SignalState } from "../state";
import { useSignalValue } from "./use-signal-value";

describe("useSignalValue()", () => {
  it("should subscribe component to signals", () => {
    const state = new SignalState(5);
    const hook = renderHook(useSignalValue, state);
    expect(hook.result.current).toBe(5);
    act(() => state.set(6));
    expect(hook.result.current).toBe(6);
  });

  it("should subscribe to fields", () => {
    const state = new SignalState({ a: 1, b: 1 });
    const hook = renderHook(() => useSignalValue(state).a);
    expect(hook.result.current).toBe(1);
    expect(hook.result.times).toBe(1);

    act(() => state.field("b").set(2));
    expect(hook.result.current).toBe(1);
    expect(hook.result.times).toBe(1);

    act(() => state.field("a").set(2));
    expect(hook.result.current).toBe(2);
    expect(hook.result.times).toBe(2);
  });
});
