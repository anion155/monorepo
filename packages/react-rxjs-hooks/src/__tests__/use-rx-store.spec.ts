import { expect, test, describe } from "@jest/globals";
import { renderHook } from "@testing-library/react";
import { BehaviorSubject } from "rxjs";

import {
  useRxStore,
  useRxStoreDispatcher,
  useRxStoreValue,
} from "../use-rx-store";
import { createReactRxStore } from "../utils";
import { mockBehaviorSubject } from "../utils/tests/mock-behavior-subject";
import { mockObservable } from "../utils/tests/mock-observable";

describe("useRxStore", () => {
  const value = Symbol("test-value") as symbol;

  test("render", () => {
    const hook = renderHook(() => useRxStore(value));
    expect(hook.result.current.getValue()).toBe(value);
  });

  test("unmount", () => {
    const subject = new BehaviorSubject(value);
    const { complete } = mockBehaviorSubject(subject);
    const hook = renderHook(() => useRxStore(subject));
    hook.unmount();

    expect(complete).toHaveBeenCalledWith();
  });

  test("unmount with initial store", () => {
    const store = createReactRxStore(value);
    const { complete } = mockBehaviorSubject(store);
    const hook = renderHook(() => useRxStore(store));
    hook.unmount();

    expect(complete).not.toHaveBeenCalled();
  });

  test("re-render", () => {
    const subject = new BehaviorSubject(value);
    const nextSubject = new BehaviorSubject(value);
    const hook = renderHook(({ sub }) => useRxStore(sub), {
      initialProps: { sub: subject },
    });
    hook.rerender({ sub: nextSubject });

    expect(Object.getPrototypeOf(hook.result.current)).toBe(subject);
  });
});

describe("useRxStoreValue", () => {
  const value = Symbol("test-value") as symbol;
  const store = createReactRxStore(value);
  const { subscribe, unsubscribe } = mockObservable(store);

  test("render", () => {
    const hook = renderHook(() => useRxStoreValue(store));

    expect(subscribe).toHaveBeenCalledWith(expect.any(Function));
    expect(hook.result.current).toBe(value);
  });

  test("unmount", () => {
    const hook = renderHook(() => useRxStore(store));
    hook.unmount();

    expect(unsubscribe).toHaveBeenCalledWith();
  });

  test("re-render, with new store", () => {
    const nextValue = Symbol("test-next-value") as symbol;
    const nextStore = createReactRxStore(nextValue);
    const next = mockObservable(nextStore);
    const hook = renderHook(({ sub }) => useRxStoreValue(sub), {
      initialProps: { sub: store },
    });
    hook.rerender({ sub: nextStore });

    expect(next.subscribe).toHaveBeenCalledWith(expect.any(Function));
    expect(unsubscribe).toHaveBeenCalledWith();
    expect(hook.result.current).toBe(nextValue);
  });
});

describe("useRxStoreDispatcher", () => {
  const value = Symbol("test-value") as symbol;
  const nextValue = Symbol("test-next") as symbol;

  test("render", () => {
    const store = createReactRxStore(value);
    const hook = renderHook(() => useRxStoreDispatcher(store));
    expect(hook.result.current).toStrictEqual(expect.any(Function));
  });

  test("dispatch value", () => {
    const store = createReactRxStore(value);
    const { getValue, next } = mockBehaviorSubject(store);
    const hook = renderHook(() => useRxStoreDispatcher(store));
    hook.result.current(nextValue);

    expect(getValue).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(nextValue);
  });

  test("dispatch value, with modifier", () => {
    const store = createReactRxStore(value);
    const { getValue, next } = mockBehaviorSubject(store);
    const hook = renderHook(() => useRxStoreDispatcher(store));
    hook.result.current((curr: any) => [curr, nextValue] as any);

    expect(getValue).toHaveBeenCalledWith();
    expect(next).toHaveBeenCalledWith([value, nextValue]);
  });
});
