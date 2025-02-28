import { describe, expect, it, jest } from "@jest/globals";

import { renderHook } from "./test-utils/render";
import { useRenderEffect } from "./use-render-effect";

describe("useRenderEffect()", () => {
  const cleanup = jest.fn(() => {});
  const effect = jest.fn(() => cleanup);

  it("should call effect", () => {
    const hook = renderHook(useRenderEffect, effect, [1, 2, 3]);

    expect(hook.result.current).toBeUndefined();
    expect(effect).toHaveBeenCalledTimes(1);
    expect(cleanup).not.toHaveBeenCalled();
  });

  it("should not call effect with same deps", () => {
    const hook = renderHook(useRenderEffect, effect, [1, 2, 3]);
    hook.rerender(effect, [1, 2, 3]);

    expect(hook.result.current).toBeUndefined();
    expect(effect).toHaveBeenCalledTimes(1);
    expect(cleanup).not.toHaveBeenCalled();
  });

  it("should not call effect with new deps", () => {
    const hook = renderHook(useRenderEffect, effect, [1, 2, 3]);
    hook.rerender(effect, [3, 2, 1]);

    expect(hook.result.current).toBeUndefined();
    expect(effect).toHaveBeenCalledTimes(2);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it("should call cleanup on unmount", () => {
    const hook = renderHook(useRenderEffect, effect, [1, 2, 3]);
    hook.unmount();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it("should handle no cleanup", () => {
    const hook = renderHook(useRenderEffect, () => {}, [1, 2, 3]);
    hook.rerender(() => {}, [3, 2, 1]);
    hook.unmount();
    expect.assertions(0);
  });
});
