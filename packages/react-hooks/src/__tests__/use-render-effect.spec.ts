import { jest, expect, test, describe } from "@jest/globals";
import { renderHook } from "@testing-library/react";
import type { DependencyList } from "react";

import { useRenderEffect } from "../use-render-effect";

describe("useRenderEffect", () => {
  const cleanup = jest.fn(() => {});
  const effect = jest.fn(() => jest.fn(() => cleanup()));

  function renderRenderEffect(initialDeps: DependencyList) {
    return renderHook(({ deps }) => useRenderEffect(effect, deps), {
      initialProps: { deps: initialDeps },
    });
  }

  test("render", () => {
    const hook = renderRenderEffect([1, 2, 3]);

    expect(hook.result.current).toBeUndefined();
    expect(effect).toHaveBeenCalledTimes(1);
    expect(cleanup).not.toHaveBeenCalled();
  });

  test("re-render with same deps", () => {
    const hook = renderRenderEffect([1, 2, 3]);
    hook.rerender({ deps: [1, 2, 3] });

    expect(hook.result.current).toBeUndefined();
    expect(effect).toHaveBeenCalledTimes(1);
    expect(cleanup).not.toHaveBeenCalled();
  });

  test("re-render with new deps", () => {
    const hook = renderRenderEffect([1, 2, 3]);
    hook.rerender({ deps: [3, 2, 1] });

    expect(hook.result.current).toBeUndefined();
    expect(effect).toHaveBeenCalledTimes(2);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  test("unmount", () => {
    const hook = renderRenderEffect([1, 2, 3]);
    hook.unmount();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
