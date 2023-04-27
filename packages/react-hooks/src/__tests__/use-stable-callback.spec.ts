import { jest, expect, test, describe } from "@jest/globals";
import { renderHook } from "@testing-library/react";

import { useStableCallback } from "../use-stable-callback";

describe("useStableCallback", () => {
  test("render", () => {
    const cb = jest.fn();
    const hook = renderHook(() => useStableCallback(cb));

    expect(hook.result.current).toStrictEqual(expect.any(Function));
    hook.result.current(1, 2);

    expect(cb).toHaveBeenCalledWith(1, 2);
  });

  test("re-render", () => {
    const firstCb = jest.fn();
    const nextCb = jest.fn();
    const hook = renderHook(({ cb }) => useStableCallback(cb), {
      initialProps: { cb: firstCb },
    });
    const firstResult = hook.result.current;
    hook.rerender({ cb: nextCb });

    expect(firstResult).toBe(hook.result.current);
    hook.result.current(1, 2);

    expect(firstCb).not.toHaveBeenCalled();
    expect(nextCb).toHaveBeenCalledWith(1, 2);
  });
});
