import { jest, expect, test, describe } from "@jest/globals";
import { renderHook } from "@testing-library/react";

import { useSetStateDispatcher } from "../use-set-state-dispatcher";

describe("useSetStateDispatcher", () => {
  const current = Symbol("test-current");
  const get = jest.fn().mockReturnValue(current);
  const set = jest.fn();

  test("render", () => {
    const hook = renderHook(() => useSetStateDispatcher(get, set));

    expect(hook.result.current).toStrictEqual(expect.any(Function));
  });

  test("dispatch value", () => {
    const next = Symbol("test-next");
    const hook = renderHook(() => useSetStateDispatcher(get, set));
    hook.result.current(next);

    expect(get).not.toHaveBeenCalled();
    expect(set).toHaveBeenCalledWith(next);
  });

  test("dispatch value, with modifier", () => {
    const next = Symbol("test-next");
    const hook = renderHook(() => useSetStateDispatcher(get, set));
    hook.result.current((curr: any) => [curr, next]);

    expect(get).toHaveBeenCalledWith();
    expect(set).toHaveBeenCalledWith([current, next]);
  });
});
