import { jest, expect, test, describe } from "@jest/globals";

import { wrapHook } from "../tests/wrap-hook";
import { useRenderDispatcher } from "../use-render-dispatcher";

const renderRenderDispatcherHook = wrapHook(useRenderDispatcher<symbol>);

describe("useRenderDispatcher", () => {
  const result = Symbol("test-result");
  const onChange = jest.fn(() => result);

  test("render", () => {
    const hook = renderRenderDispatcherHook([1], onChange);

    expect(hook.result.current).toBe(result);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(undefined, undefined);
  });

  test("render, with same deps", () => {
    const hook = renderRenderDispatcherHook([1], onChange);
    hook.rerender([1], onChange);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(hook.result.current).toBe(result);
  });

  test("render, with new deps", () => {
    const hook = renderRenderDispatcherHook([1], onChange);
    hook.rerender([2], onChange);

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenCalledWith(result, [1]);
  });
});
