import { jest, expect, test, describe } from "@jest/globals";
import { wrapHook } from "@monorepo/utils";
import { renderHook } from "@testing-library/react";

import { useFabric } from "../use-fabric";

const renderFabricHook = wrapHook(useFabric<symbol>, renderHook);

describe("useFabric", () => {
  const result1 = Symbol("test-result-1");
  const result2 = Symbol("test-result-2");
  const fabric = jest.fn(() => result1);

  test("render", () => {
    const hook = renderFabricHook(fabric, [1]);

    expect(hook.result.current).toBe(result1);
    expect(fabric).toHaveBeenCalledTimes(1);
    expect(fabric).toHaveBeenCalledWith();
  });

  test("re-render, with same deps", () => {
    const hook = renderFabricHook(fabric, [1]);
    hook.rerender(fabric, [1]);

    expect(fabric).toHaveBeenCalledTimes(1);
  });

  test("re-render, with next deps", () => {
    fabric.mockReturnValueOnce(result2);
    const hook = renderFabricHook(fabric, [1]);

    expect(hook.result.current).toBe(result2);
    hook.rerender(fabric, [2]);
    expect(hook.result.current).toBe(result1);

    expect(fabric).toHaveBeenCalledTimes(2);
    expect(fabric).toHaveBeenCalledWith();
  });
});
