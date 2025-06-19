import { describe, expect, it, jest } from "@jest/globals";

import { renderHook } from "../test-utils/render";
import { useRenderDispatcher } from "./use-render-dispatcher";

describe("useRenderDispatcher()", () => {
  const result = Symbol("test-result");
  const onChange = jest.fn((..._params: unknown[]) => result);

  it("should return result and call onChange one time", () => {
    const hook = renderHook(useRenderDispatcher<symbol>, [1], onChange);
    expect(hook.result.current).toBe(result);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(undefined, undefined);
  });

  it("should not call onChange if deps are the same", () => {
    const hook = renderHook(useRenderDispatcher<symbol>, [1], onChange);
    hook.rerender([1], onChange);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(hook.result.current).toBe(result);
  });

  it("should call onChange if deps changed", () => {
    const hook = renderHook(useRenderDispatcher<symbol>, [1], onChange);
    hook.rerender([2], onChange);

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenCalledWith(result, [1]);
  });
});
