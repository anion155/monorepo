import { jest, expect, test, describe } from "@jest/globals";
import { wrapHook } from "@monorepo/configs/src/wrap-hook";

import { useConst } from "../use-const";

const renderConstHook = wrapHook(useConst<symbol>);

describe("useConst", () => {
  const result = Symbol("test-result");
  const fabric = jest.fn(() => result);

  test("render", () => {
    const hook = renderConstHook(fabric);

    expect(hook.result.current).toBe(result);
    expect(fabric).toHaveBeenCalledWith();
  });

  test("re-render", () => {
    const hook = renderConstHook(fabric);
    hook.rerender(fabric);

    expect(hook.result.current).toBe(result);
    expect(fabric).toHaveBeenCalledTimes(1);
  });

  test("re-render, with new fabric", () => {
    const hook = renderConstHook(fabric);
    const newFabric = jest.fn(() => result);
    hook.rerender(newFabric);

    expect(hook.result.current).toBe(result);
    expect(fabric).toHaveBeenCalledTimes(1);
    expect(newFabric).not.toHaveBeenCalled();
  });
});
