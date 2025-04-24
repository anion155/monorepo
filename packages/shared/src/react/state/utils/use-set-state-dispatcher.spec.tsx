import { describe, expect, it, jest } from "@jest/globals";

import { renderHook } from "../../test-utils";
import { useSetStateDispatcher } from "./use-set-state-dispatcher";

describe("useSetStateDispatcher()", () => {
  it("should return state dispatcher", () => {
    const set = jest.fn();
    const hook = renderHook(useSetStateDispatcher<number>, () => 5, set);
    expect(hook.result.current).toBeInstanceOf(Function);

    hook.result.current(1);
    expect(set).toHaveBeenCalledWith(1);

    hook.result.current((current) => current * 2);
    expect(set).toHaveBeenCalledWith(10);
  });
});
