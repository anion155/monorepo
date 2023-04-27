import { jest, expect, test, describe } from "@jest/globals";
import { renderHook } from "@testing-library/react";
import type { DependencyList } from "react";

import { useFabric } from "../use-fabric";

describe("useFabric", () => {
  const result1 = Symbol("test-result-1");
  const result2 = Symbol("test-result-2");
  const fabric = jest.fn().mockReturnValue(result1);

  function renderFabricHook(initialDeps: DependencyList) {
    return renderHook(({ deps }) => useFabric(fabric, deps), {
      initialProps: { deps: initialDeps },
    });
  }

  test("render", () => {
    const hook = renderFabricHook([1]);

    expect(hook.result.current).toBe(result1);
    expect(fabric).toHaveBeenCalledTimes(1);
    expect(fabric).toHaveBeenCalledWith();
  });

  test("re-render, with same deps", () => {
    const hook = renderFabricHook([1]);
    hook.rerender({ deps: [1] });

    expect(fabric).toHaveBeenCalledTimes(1);
  });

  test("re-render, with next deps", () => {
    fabric.mockReturnValueOnce(result2);
    const hook = renderFabricHook([1]);

    expect(hook.result.current).toBe(result2);
    hook.rerender({ deps: [2] });
    expect(hook.result.current).toBe(result1);

    expect(fabric).toHaveBeenCalledTimes(2);
    expect(fabric).toHaveBeenCalledWith();
  });
});
