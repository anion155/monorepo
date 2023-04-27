import { wrapHook } from "@anion155/react-hooks/utils/tests";
import { jest, expect, test, describe } from "@jest/globals";
import { Subscription, of } from "rxjs";

import { useRxSubscription } from "../use-rx-subscription";
import { mockObservable } from "../utils/tests/mock-observable";

const renderRxSubscriptionHook = wrapHook(useRxSubscription);

describe("useRxSubscription", () => {
  test("render, with subscription fabric", () => {
    const subscription = new Subscription();
    const fabric = jest.fn(() => subscription);
    const hook = renderRxSubscriptionHook(fabric, []);

    expect(hook.result.current).toBeUndefined();
    expect(fabric).toHaveBeenCalledTimes(1);
  });

  test("render, with observable fabric", () => {
    const source = of(5);
    const { subscribe } = mockObservable(source);
    const hook = renderRxSubscriptionHook(() => source, []);

    expect(hook.result.current).toBeUndefined();
    expect(subscribe).toHaveBeenCalledTimes(1);
    expect(subscribe).toHaveBeenCalledWith();
  });

  test("render, with observable input fabric", () => {
    const hook = renderRxSubscriptionHook(() => [5], []);

    expect(hook.result.current).toBeUndefined();
  });

  test("re-render, with new deps", () => {
    const unsubscribe1 = jest.fn();
    const unsubscribe2 = jest.fn();
    const createFabric = (unsubscribe: () => void) => () =>
      Object.assign(new Subscription(), { unsubscribe });
    const hook = renderRxSubscriptionHook(createFabric(unsubscribe1), [1]);
    hook.rerender(createFabric(unsubscribe2), [2]);

    expect(unsubscribe1).toHaveBeenCalledTimes(1);
    expect(unsubscribe2).not.toHaveBeenCalled();
  });

  test("unmount", () => {
    const subscription = new Subscription();
    const unsubscribe = jest.spyOn(subscription, "unsubscribe");
    const hook = renderRxSubscriptionHook(() => subscription, []);
    hook.unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
