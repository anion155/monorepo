import { jest, expect, test, describe } from "@jest/globals";
import { renderHook } from "@testing-library/react";
import type { DependencyList } from "react";

import { useRenderDispatcher } from "../use-render-dispatcher";

describe("useRenderDispatcher", () => {
  const result = Symbol("test-result");
  const onChange = jest.fn().mockReturnValue(result);

  function renderUseRenderDispatcher(initialDeps: DependencyList) {
    return renderHook(({ deps }) => useRenderDispatcher(deps, onChange), {
      initialProps: { deps: initialDeps },
    });
  }

  test("render", () => {
    const hook = renderUseRenderDispatcher([1]);

    expect(hook.result.current).toBe(result);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(undefined, undefined);
  });

  test("render, with same deps", () => {
    const hook = renderUseRenderDispatcher([1]);
    hook.rerender({ deps: [1] });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(hook.result.current).toBe(result);
  });

  test("render, with new deps", () => {
    const hook = renderUseRenderDispatcher([1]);
    hook.rerender({ deps: [2] });

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenCalledWith(result, [1]);
  });
});
