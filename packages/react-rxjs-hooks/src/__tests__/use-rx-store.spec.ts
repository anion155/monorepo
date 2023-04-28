import { expect, test, describe } from "@jest/globals";
import { wrapHook } from "@monorepo/configs/src/wrap-hook";
import { BehaviorSubject } from "rxjs";

import { mockBehaviorSubject } from "../../tests/mock-behavior-subject";
import { mockObservable } from "../../tests/mock-observable";
import {
  useRxStore,
  useRxStoreDispatcher,
  useRxStoreValue,
} from "../use-rx-store";
import { createReactRxStore } from "../utils";

const renderRxStoreHook = wrapHook(useRxStore<symbol>);
const renderRxStoreValueHook = wrapHook(useRxStoreValue<symbol>);
const renderRxStoreDispatcherHook = wrapHook(useRxStoreDispatcher<symbol>);

describe("useRxStore", () => {
  const value = Symbol("test-value") as symbol;

  test("render", () => {
    const hook = renderRxStoreHook(value);
    expect(hook.result.current.getValue()).toBe(value);
  });

  test("unmount", () => {
    const subject = new BehaviorSubject(value);
    const { complete } = mockBehaviorSubject(subject);
    const hook = renderRxStoreHook(subject);
    hook.unmount();

    expect(complete).toHaveBeenCalledWith();
  });

  test("unmount with initial store", () => {
    const store = createReactRxStore(value);
    const { complete } = mockBehaviorSubject(store);
    const hook = renderRxStoreHook(store);
    hook.unmount();

    expect(complete).not.toHaveBeenCalled();
  });

  test("re-render", () => {
    const subject = new BehaviorSubject(value);
    const nextSubject = new BehaviorSubject(value);
    const hook = renderRxStoreHook(subject);
    hook.rerender(nextSubject);

    expect(Object.getPrototypeOf(hook.result.current)).toBe(subject);
  });
});

describe("useRxStoreValue", () => {
  const value = Symbol("test-value") as symbol;
  const store = createReactRxStore(value);
  const { subscribe, unsubscribe } = mockObservable(store);

  test("render", () => {
    const hook = renderRxStoreValueHook(store);

    expect(subscribe).toHaveBeenCalledWith(expect.any(Function));
    expect(hook.result.current).toBe(value);
  });

  test("unmount", () => {
    const hook = renderRxStoreValueHook(store);
    hook.unmount();

    expect(unsubscribe).toHaveBeenCalledWith();
  });

  test("re-render, with new store", () => {
    const nextValue = Symbol("test-next-value") as symbol;
    const nextStore = createReactRxStore(nextValue);
    const next = mockObservable(nextStore);
    const hook = renderRxStoreValueHook(store);
    hook.rerender(nextStore);

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
    const hook = renderRxStoreDispatcherHook(store);
    expect(hook.result.current).toStrictEqual(expect.any(Function));
  });

  test("dispatch value", () => {
    const store = createReactRxStore(value);
    const { getValue, next } = mockBehaviorSubject(store);
    const hook = renderRxStoreDispatcherHook(store);
    hook.result.current(nextValue);

    expect(getValue).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(nextValue);
  });

  test("dispatch value, with modifier", () => {
    const store = createReactRxStore(value);
    const { getValue, next } = mockBehaviorSubject(store);
    const hook = renderRxStoreDispatcherHook(store);
    hook.result.current((curr: any) => [curr, nextValue] as any);

    expect(getValue).toHaveBeenCalledWith();
    expect(next).toHaveBeenCalledWith([value, nextValue]);
  });
});
