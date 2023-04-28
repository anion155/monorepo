import { jest, expect, test, describe } from "@jest/globals";
import { wrapHook } from "@monorepo/configs/src/wrap-hook";

import { useStableCallback } from "../use-stable-callback";

const renderStableCallbackHook = wrapHook(
  useStableCallback<(a: number, b: number) => void>
);

describe("useStableCallback", () => {
  test("render", () => {
    const cb = jest.fn();
    const hook = renderStableCallbackHook(cb);

    expect(hook.result.current).toStrictEqual(expect.any(Function));
    hook.result.current(1, 2);

    expect(cb).toHaveBeenCalledWith(1, 2);
  });

  test("re-render", () => {
    const firstCb = jest.fn();
    const nextCb = jest.fn();
    const hook = renderStableCallbackHook(firstCb);
    const firstResult = hook.result.current;
    hook.rerender(nextCb);

    expect(firstResult).toBe(hook.result.current);
    hook.result.current(1, 2);

    expect(firstCb).not.toHaveBeenCalled();
    expect(nextCb).toHaveBeenCalledWith(1, 2);
  });
});
