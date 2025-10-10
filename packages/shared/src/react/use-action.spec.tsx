import { describe, expect, it, jest } from "@jest/globals";
import { waitFor } from "@testing-library/react";
import { Suspense } from "react";

import { Action, InvalidActionState } from "../action";
import { createErrorClass } from "../errors";
import { ErrorBoundary } from "./error-boundary";
import { act, render, renderHook } from "./test-utils/render";
import { useActionAwait, useActionCall, useActionResultState, useActionRunningState, useActionState } from "./use-action";

describe("Action hooks", () => {
  describe("useActionRunningState()", () => {
    it("should update", async () => {
      const deferred = Promise.withResolvers<string>();
      const action = new Action(() => deferred.promise);
      const hook = renderHook(useActionRunningState<[], string>, action);
      expect(hook.result.current).toStrictEqual({ status: "idle" });

      void action.run();
      await act(() => Promise.resolve());
      expect(hook.result.current).toStrictEqual({ status: "pending", params: [], abort: expect.any(Function), promise: expect.any(Promise) });

      deferred.resolve("test");
      await act(() => Promise.resolve());
      expect(hook.result.current).toStrictEqual({ status: "idle" });
    });
  });

  describe("useActionResultState()", () => {
    it("should update", async () => {
      const deferred = Promise.withResolvers<string>();
      const action = new Action(() => deferred.promise);
      const hook = renderHook(useActionResultState<[], string>, action);
      expect(hook.result.current).toStrictEqual(undefined);

      void action.run();
      await act(() => Promise.resolve());
      expect(hook.result.current).toStrictEqual(undefined);

      deferred.resolve("test");
      await act(() => Promise.resolve());
      expect(hook.result.current).toStrictEqual({ status: "resolved", params: [], value: "test" });
    });
  });

  describe("useActionState()", () => {
    it("should update", async () => {
      const deferred = Promise.withResolvers<string>();
      const action = new Action(() => deferred.promise);
      const hook = renderHook(useActionState<[], string>, action);
      expect(hook.result.current).toStrictEqual({ status: "idle" });

      void action.run();
      await act(() => Promise.resolve());
      expect(hook.result.current).toStrictEqual({ status: "pending", params: [], promise: expect.any(Promise), abort: expect.any(Function) });

      deferred.resolve("test");
      await act(() => Promise.resolve());
      expect(hook.result.current).toStrictEqual({ status: "resolved", params: [], value: "test" });
    });
  });

  describe("useActionAwait()", () => {
    const renderSuspense = render.with(<Suspense fallback="loading" />);

    it("should suspense value", async () => {
      let deferred = Promise.withResolvers<string>();
      const action = new Action((_param: number) => deferred.promise);
      const spy = jest.fn();
      const Test = ({ param = 1 }: { param?: number }) => {
        spy(useActionAwait<[number], string>(action, param));
        return "resolved";
      };
      const component = await renderSuspense.acted(<Test />);
      expect(component.asFragment()).toHaveTextContent("loading");
      expect(spy).not.toHaveBeenCalled();

      deferred.resolve("test-1");
      await act(() => Promise.resolve());
      expect(component.asFragment()).toHaveTextContent("resolved");
      expect(spy).toHaveBeenCalledWith("test-1");

      spy.mockClear();
      deferred = Promise.withResolvers();
      component.rerender(<Test param={2} />);
      expect(component.asFragment()).toHaveTextContent("loading");
      expect(spy).not.toHaveBeenCalled();

      deferred.resolve("test-2");
      await act(() => Promise.resolve());
      expect(component.asFragment()).toHaveTextContent("resolved");
      expect(spy).toHaveBeenCalledWith("test-2");
    });

    it("should rethrow action error", async () => {
      class TestError extends createErrorClass("TestError") {}

      const deferred = Promise.withResolvers<string>();
      const action = new Action(() => deferred.promise);
      const Test = () => {
        useActionAwait<[], string>(action);
        return "resolved";
      };

      using errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const component = await renderSuspense.with(<ErrorBoundary fallback="error" />).acted(<Test />);
      expect(component.asFragment()).toHaveTextContent("loading");

      deferred.reject(new TestError());
      await waitFor(() => expect(component.asFragment()).toHaveTextContent("error"));
      expect(errorSpy.mock.calls).toStrictEqual([
        [expect.any(String), new TestError(), "The above error occurred in the <Test> component.", expect.any(String)],
      ]);
    });

    it("should throw InvalidActionState", async () => {
      const deferred = Promise.withResolvers<string>();
      const action = new Action(() => deferred.promise);
      const Test = () => {
        useActionAwait<[], string>(action);
        return "resolved";
      };
      const component = await renderSuspense.acted(<Test />);
      expect(component.asFragment()).toHaveTextContent("loading");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      delete (action as any)._private_running.promise;
      expect(() => component.rerender(<Test />)).toStrictThrow(new InvalidActionState());
    });
  });

  describe("useActionCall()", () => {
    it("should suspense value", async () => {
      const deferred = Promise.withResolvers<string>();
      const spy = jest.fn((..._params: unknown[]) => deferred.promise);
      const action = new Action(spy);
      const hook = renderHook(useActionCall<unknown[], string>, action, 1, 2);

      await act(() => Promise.resolve());
      expect(hook.result.current).toStrictEqual({
        action,
        status: "pending",
        params: [1, 2],
        promise: expect.any(Promise),
        abort: expect.any(Function),
      });

      deferred.resolve("test");
      await act(() => Promise.resolve());
      expect(hook.result.current).toStrictEqual({ action, status: "resolved", params: [1, 2], value: "test" });
    });
  });
});
