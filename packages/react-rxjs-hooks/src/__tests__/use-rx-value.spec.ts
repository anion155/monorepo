import { asyncDelay } from "@anion155/react-hooks/utils";
import { describe, expect, test } from "@jest/globals";
import { wrapHook } from "@monorepo/configs/src/wrap-hook";
import { waitFor } from "@testing-library/react";
import { delay, of } from "rxjs";

import { mockObservable } from "../../tests/mock-observable";
import { useRxValue } from "../use-rx-value";

const renderRxValueHook = wrapHook(useRxValue<symbol>);

describe("useRxValue", () => {
  const value = Symbol("test-value") as symbol;
  const source = of(value);
  const { subscribe, unsubscribe } = mockObservable(source);

  test("render", () => {
    const hook = renderRxValueHook(() => source, []);

    expect(hook.result.current).toStrictEqual(value);
    expect(subscribe).toHaveBeenCalledTimes(1);
    expect(unsubscribe).not.toHaveBeenCalled();
  });

  test("render with delayed observable", async () => {
    const hook = renderRxValueHook(() => source.pipe(delay(100)), []);

    expect(hook.result.current).toBeUndefined();
    await waitFor(() => asyncDelay(200));
    expect(hook.result.current).toStrictEqual(value);
  });

  test("re-render with next deps", async () => {
    const hook = renderRxValueHook(() => source, [1]);
    hook.rerender(() => source, [2]);

    expect(subscribe).toHaveBeenCalledTimes(2);
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
