import { describe, expect, test } from "@jest/globals";
import { act, renderHook } from "@testing-library/react";
import { BehaviorSubject } from "rxjs";

import { useRxStoreObservableFiller } from "../use-rx-store-observable-filler";

describe("useRxStoreObservableFiller", () => {
  test("render", () => {
    const subject = new BehaviorSubject(5);
    const hook = renderHook(() =>
      useRxStoreObservableFiller(() => subject, [])
    );
    const store = hook.result.current;

    expect(store.getValue()).toBe(5);
    act(() => subject.next(6));
    expect(store.getValue()).toBe(6);
  });
});
