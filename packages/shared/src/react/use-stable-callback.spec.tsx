import { describe, expect, it, jest } from "@jest/globals";

import { renderHook } from "./test-utils/render";
import { useStableCallback } from "./use-stable-callback";

describe("useStableCallback()", () => {
  it("should return callback", () => {
    const cb = jest.fn();
    const hook = renderHook(useStableCallback<(a: number, b: number) => void>, cb);

    expect(hook.result.current).toStrictEqual(expect.any(Function));
    hook.result.current(1, 2);

    expect(cb).toHaveBeenCalledWith(1, 2);
  });

  it("should not change callback on rerender", () => {
    const firstCb = jest.fn();
    const nextCb = jest.fn();
    const hook = renderHook(useStableCallback<(a: number, b: number) => void>, firstCb);
    const firstResult = hook.result.current;
    hook.rerender(nextCb);

    expect(firstResult).toBe(hook.result.current);
    hook.result.current(1, 2);

    expect(firstCb).not.toHaveBeenCalled();
    expect(nextCb).toHaveBeenCalledWith(1, 2);
  });

  it("without provided callback should return callback that return undefined", () => {
    const hook = renderHook(useStableCallback<(a: number, b: number) => void>, undefined);
    expect(hook.result.current(1, 2)).toBeUndefined();
  });
});
