import { jest, expect, test, describe } from "@jest/globals";

import { wrapHook } from "../../test-utils/wrap-hook";
import { useRenderEffect } from "../use-render-effect";

const renderRenderEffectHook = wrapHook(useRenderEffect);

describe("useRenderEffect", () => {
  const cleanup = jest.fn(() => {});
  const effect = jest.fn(() => jest.fn(() => cleanup()));

  test("render", () => {
    const hook = renderRenderEffectHook(effect, [1, 2, 3]);

    expect(hook.result.current).toBeUndefined();
    expect(effect).toHaveBeenCalledTimes(1);
    expect(cleanup).not.toHaveBeenCalled();
  });

  test("re-render with same deps", () => {
    const hook = renderRenderEffectHook(effect, [1, 2, 3]);
    hook.rerender(effect, [1, 2, 3]);

    expect(hook.result.current).toBeUndefined();
    expect(effect).toHaveBeenCalledTimes(1);
    expect(cleanup).not.toHaveBeenCalled();
  });

  test("re-render with new deps", () => {
    const hook = renderRenderEffectHook(effect, [1, 2, 3]);
    hook.rerender(effect, [3, 2, 1]);

    expect(hook.result.current).toBeUndefined();
    expect(effect).toHaveBeenCalledTimes(2);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  test("unmount", () => {
    const hook = renderRenderEffectHook(effect, [1, 2, 3]);
    hook.unmount();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
