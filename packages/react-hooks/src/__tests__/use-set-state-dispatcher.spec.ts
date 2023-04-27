import { jest, expect, test, describe } from "@jest/globals";

import { wrapHook } from "../../test-utils/wrap-hook";
import { useSetStateDispatcher } from "../use-set-state-dispatcher";

const renderSetStateDispatcherHook = wrapHook(useSetStateDispatcher<symbol>);

describe("useSetStateDispatcher", () => {
  const current = Symbol("test-current");
  const get = jest.fn(() => current);
  const set = jest.fn((v: symbol) => v);

  test("render", () => {
    const hook = renderSetStateDispatcherHook(get, set);

    expect(hook.result.current).toStrictEqual(expect.any(Function));
  });

  test("dispatch value", () => {
    const next = Symbol("test-next");
    const hook = renderSetStateDispatcherHook(get, set);
    hook.result.current(next);

    expect(get).not.toHaveBeenCalled();
    expect(set).toHaveBeenCalledWith(next);
  });

  test("dispatch value, with modifier", () => {
    const next = Symbol("test-next");
    const hook = renderSetStateDispatcherHook(get, set);
    hook.result.current(() => next);

    expect(get).toHaveBeenCalledWith();
    expect(set).toHaveBeenCalledWith(next);
  });
});
