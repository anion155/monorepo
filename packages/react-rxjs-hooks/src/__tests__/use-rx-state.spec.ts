import { describe, expect, test } from "@jest/globals";
import { wrapHook } from "@monorepo/utils";
import { act, renderHook } from "@testing-library/react";

import { useRxState } from "../use-rx-state";
import { createReactRxStore } from "../utils";

const renderRxStateHook = wrapHook(useRxState<symbol>, renderHook);

describe("useRxState", () => {
  const value = Symbol("test-value") as symbol;
  const nextValue = Symbol("test-next") as symbol;

  test("render", () => {
    const store = createReactRxStore(value);
    const hook = renderRxStateHook(store);

    expect(hook.result.current).toStrictEqual([
      value,
      expect.any(Function),
      store,
    ]);
  });

  test("dispatch value", () => {
    const store = createReactRxStore(value);
    const hook = renderRxStateHook(store);
    act(() => hook.result.current[1](nextValue));

    expect(hook.result.current[0]).toBe(nextValue);
  });

  test("dispatch value, with modifier", () => {
    const store = createReactRxStore(value);
    const hook = renderRxStateHook(store);
    act(() => hook.result.current[1]((curr: any) => [curr, nextValue] as any));

    expect(hook.result.current[0]).toStrictEqual([value, nextValue]);
  });
});
