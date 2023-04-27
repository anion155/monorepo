import { wrapHook } from "@anion155/react-hooks/utils/tests";
import { describe, expect, test } from "@jest/globals";
import { act } from "@testing-library/react";
import { BehaviorSubject } from "rxjs";

import { useRxStoreObservableFiller } from "../use-rx-store-observable-filler";

const renderRxStoreObservableFillerHook = wrapHook(
  useRxStoreObservableFiller<number>
);

describe("useRxStoreObservableFiller", () => {
  test("render", () => {
    const subject = new BehaviorSubject(5);
    const hook = renderRxStoreObservableFillerHook(() => subject, []);
    const store = hook.result.current;

    expect(store.getValue()).toBe(5);
    act(() => subject.next(6));
    expect(store.getValue()).toBe(6);
  });
});
