import { describe, expect, jest, test } from "@jest/globals";
import { wrapHook } from "@monorepo/configs/src/wrap-hook";
import { act } from "@testing-library/react";

import { useRxEventStore } from "../use-rx-event-store";
import { createReactRxStore } from "../utils";

const renderRxEventStoreHook = wrapHook(useRxEventStore<symbol>);
const renderRxEventStoreWithProjectHook = wrapHook(
  useRxEventStore<[value: symbol], { v: symbol }>
);

describe("useRxEventStore", () => {
  const value = Symbol("test-value") as symbol;
  const store = createReactRxStore(value);
  const projectedStore = createReactRxStore({ v: value });
  const project = jest.fn((v: symbol) => ({ v }));

  test("render", () => {
    const hook = renderRxEventStoreHook(store);
    expect(hook.result.current).toStrictEqual([store, expect.any(Function)]);
  });

  test("re-render with next store", () => {
    const nextStore = createReactRxStore(value);
    const hook = renderRxEventStoreHook(store);
    const first = hook.result.current;
    hook.rerender(nextStore);

    expect(hook.result.current).toStrictEqual(first);
  });

  test("re-render with next project, same deps", () => {
    const nextProject = jest.fn((v: symbol) => ({ v }));
    const hook = renderRxEventStoreWithProjectHook(projectedStore, project, []);
    const first = hook.result.current;
    hook.rerender(projectedStore, nextProject, []);

    expect(hook.result.current).toStrictEqual(first);
  });

  test("re-render with next project, next deps", () => {
    const nextProject = jest.fn((v: symbol) => ({ v }));
    const hook = renderRxEventStoreWithProjectHook(projectedStore, project, [
      1,
    ]);
    const first = hook.result.current;
    hook.rerender(projectedStore, nextProject, [2]);

    expect(hook.result.current[0]).toBe(first[0]);
    expect(hook.result.current[1]).not.toBe(first[1]);
  });

  test("handleEvent", () => {
    const nextValue = Symbol("test-next-value") as symbol;
    const hook = renderRxEventStoreHook(store);
    act(() => hook.result.current[1](nextValue));

    expect(hook.result.current[0].getValue()).toBe(nextValue);
  });

  test("handleEvent with project", () => {
    const nextValue = Symbol("test-next-value") as symbol;
    const hook = renderRxEventStoreWithProjectHook(projectedStore, project, []);
    act(() => hook.result.current[1](nextValue));

    expect(hook.result.current[0].getValue()).toStrictEqual({ v: nextValue });
  });
});
