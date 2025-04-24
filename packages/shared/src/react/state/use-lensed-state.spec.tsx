import { describe, expect, it } from "@jest/globals";
import { useState } from "react";

import { act, renderHook } from "../test-utils";
import { useLensedState } from "./use-lensed-state";

describe("useLensedState()", () => {
  it("should create lensed state", () => {
    const setter = (value: string) => parseInt(value);
    const hook = renderHook(() => {
      const state = useState(0);
      const lensed = useLensedState(state, String, setter);
      return { state, lensed };
    });
    expect(hook.result.current.lensed).toStrictEqual(["0", expect.any(Function)]);

    act(() => hook.result.current.lensed[1]("5"));
    expect(hook.result.current.state[0]).toBe(5);

    act(() => hook.result.current.state[1](10));
    expect(hook.result.current.lensed[0]).toBe("10");
  });
});
