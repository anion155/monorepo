import { jest, expect, test, describe } from "@jest/globals";
import { act } from "@testing-library/react";

import { wrapHook } from "../../test-utils/wrap-hook";
import { useEventState } from "../use-event-state";

const renderEventStateHook = wrapHook(useEventState<symbol>);
const renderEventStateProjectedHook = wrapHook(
  useEventState<[value: symbol], { value: symbol }>
);

describe("useEventState", () => {
  const initial = Symbol("test-initial-value") as symbol;
  const next = Symbol("test-next-value") as symbol;
  const project = jest.fn((value: symbol) => ({ value }));

  test("render, with initial value", () => {
    const hook = renderEventStateHook(initial);
    expect(hook.result.current[0]).toBe(initial);
  });

  test("render, with initial value fabric", () => {
    const hook = renderEventStateHook(() => initial);
    expect(hook.result.current[0]).toBe(initial);
  });

  test("render, with new initial value", () => {
    const hook = renderEventStateHook(initial);
    hook.rerender(next);

    expect(hook.result.current[0]).toBe(initial);
  });

  test("eventDispatcher", () => {
    const hook = renderEventStateHook(initial);
    act(() => hook.result.current[1](next));

    expect(hook.result.current[0]).toStrictEqual(next);
  });

  test("eventDispatcher, with project", () => {
    const hook = renderEventStateProjectedHook({ value: initial }, project, []);
    act(() => hook.result.current[1](next));

    expect(project).toHaveBeenCalledWith(next);
    expect(hook.result.current[0]).toStrictEqual({ value: next });
  });

  test("project do not update without deps change", () => {
    const nextProject = jest.fn((value: symbol) => ({ value }));
    const hook = renderEventStateProjectedHook({ value: initial }, project, []);
    hook.rerender({ value: initial }, nextProject, []);
    act(() => hook.result.current[1](next));

    expect(project).toHaveBeenCalledWith(next);
    expect(nextProject).not.toHaveBeenCalled();
  });

  test("project update with deps change", () => {
    const nextProject = jest.fn((value: symbol) => ({ value }));
    const hook = renderEventStateProjectedHook({ value: initial }, project, [
      0,
    ]);
    hook.rerender({ value: initial }, nextProject, [1]);
    act(() => hook.result.current[1](next));

    expect(project).not.toHaveBeenCalled();
    expect(nextProject).toHaveBeenCalledWith(next);
  });
});
