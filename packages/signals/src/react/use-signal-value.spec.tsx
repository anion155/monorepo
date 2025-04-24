import "../signal-computed-extensions";

import { act, renderHook } from "@anion155/shared/react";
import { describe, expect, it } from "@jest/globals";

import { SignalState } from "../index";
import { useSignalValue } from "./use-signal-value";

describe("useSignalValue()", () => {
  it("should subscribe component to signals", () => {
    const state = new SignalState(5);
    const hook = renderHook(useSignalValue, state);
    expect(hook.result.current).toBe(5);
    act(() => state.set(6));
    expect(hook.result.current).toBe(6);
  });
});
