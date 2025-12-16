import "../global/abort";
import "../global/promise";

import { describe, it, jest } from "@jest/globals";
import expect from "expect";

import { AbortError } from "../abort";
import { doThrow } from "../do";
import { createErrorClass } from "../errors";
import { Action, ActionRunningStatePending, CachedAction, InvalidActionState } from "./action";

describe("actions", () => {
  describe("class Action", () => {
    class TestError extends createErrorClass("TestError") {}

    it("should update state", async () => {
      let deferred = Promise.withResolvers<string>();
      const spy = jest.fn((..._params: unknown[]) => deferred.promise);
      const action = new Action(spy);
      expect(spy).not.toHaveBeenCalled();
      expect(action.running).toStrictEqual({ status: "idle" });
      expect(action.result).toStrictEqual(undefined);
      expect(action.state).toBe(action.running);

      let promise = action.run(1, 2);
      expect(spy).toHaveBeenCalledWith(1, 2);
      expect(action.running).toStrictEqual({
        status: "pending",
        params: [1, 2],
        abort: expect.any(Function),
        result: deferred.promise,
        promise: expect.any(Promise),
      });
      expect(action.result).toStrictEqual(undefined);
      expect(action.state).toBe(action.running);

      deferred.resolve("test-1");
      await expect(promise).resolves.toBe("test-1");
      expect(action.running).toStrictEqual({ status: "idle" });
      expect(action.result).toStrictEqual({ status: "resolved", params: [1, 2], value: "test-1" });
      expect(action.state).toBe(action.result);

      deferred = Promise.withResolvers<string>();
      promise = action.run(2, 3);
      expect(spy).toHaveBeenCalledWith(2, 3);
      expect(action.running).toStrictEqual({
        status: "pending",
        params: [2, 3],
        abort: expect.any(Function),
        result: deferred.promise,
        promise: expect.any(Promise),
      });
      expect(action.result).toStrictEqual({ status: "resolved", params: [1, 2], value: "test-1" });
      expect(action.state).toBe(action.running);

      deferred.resolve("test-2");
      await expect(promise).resolves.toBe("test-2");
      expect(action.running).toStrictEqual({ status: "idle" });
      expect(action.result).toStrictEqual({ status: "resolved", params: [2, 3], value: "test-2" });
      expect(action.state).toBe(action.result);

      deferred = Promise.withResolvers<string>();
      promise = action.run(3, 4);
      expect(spy).toHaveBeenCalledWith(3, 4);
      expect(action.running).toStrictEqual({
        status: "pending",
        params: [3, 4],
        abort: expect.any(Function),
        result: deferred.promise,
        promise: expect.any(Promise),
      });
      expect(action.result).toStrictEqual({ status: "resolved", params: [2, 3], value: "test-2" });
      expect(action.state).toBe(action.running);

      deferred.reject(new TestError("test error"));
      await expect(promise).rejects.toStrictThrow(new TestError("test error"));
      expect(action.running).toStrictEqual({ status: "idle" });
      expect(action.result).toStrictEqual({ status: "rejected", params: [3, 4], reason: new TestError("test error") });
      expect(action.state).toBe(action.result);

      deferred = Promise.withResolvers<string>();
      promise = action.run(4, 5);
      expect(spy).toHaveBeenCalledWith(4, 5);
      expect(action.running).toStrictEqual({
        status: "pending",
        params: [4, 5],
        abort: expect.any(Function),
        result: deferred.promise,
        promise: expect.any(Promise),
      });
      expect(action.result).toStrictEqual({ status: "rejected", params: [3, 4], reason: new TestError("test error") });
      expect(action.state).toBe(action.running);

      (action.running as ActionRunningStatePending<unknown[], string>).abort();
      await Promise.delay(1);
      expect(action.running).toStrictEqual({ status: "idle" });
      expect(action.result).toStrictEqual({ status: "rejected", params: [4, 5], reason: new AbortError() });
      expect(action.state).toBe(action.result);
    });

    it("should cancel previous call on second call", () => {
      let deferred: PromiseWithResolvers<string>;
      const action = new Action((_index: number) => deferred.promise);
      deferred = Promise.withResolvers<string>();
      void action.run(1);
      deferred = Promise.withResolvers<string>();
      void action.run(2);

      expect(action.state).toStrictEqual({
        status: "pending",
        params: [2],
        abort: expect.any(Function),
        result: deferred.promise,
        promise: expect.any(Promise),
      });
    });

    it("should handle sync result", async () => {
      const action = new Action(() => 5);
      await expect(action.run()).resolves.toBe(5);
    });

    it("should handle sync error in callback", () => {
      const action = new Action(() => doThrow(new TestError()));
      expect(() => action.run()).toStrictThrow(new TestError());
      expect(action.state).toStrictEqual({ status: "rejected", params: [], reason: new TestError() });
    });

    it("should ignore abort call after resolution", async () => {
      const deferred = Promise.withResolvers<string>();
      const action = new Action(() => deferred.promise);
      const promise = action.run();
      const { abort } = action.running as ActionRunningStatePending<unknown[], string>;
      deferred.resolve("test");
      await promise;
      abort();
      expect(action.state).toStrictEqual({ status: "resolved", params: [], value: "test" });
    });

    it("should ignore resoltion after abort", async () => {
      let deferred = Promise.withResolvers<string>();
      const action = new Action(() => deferred.promise);
      let promise = action.run();
      (action.running as ActionRunningStatePending<unknown[], string>).abort();
      deferred.resolve("test");
      await promise;
      expect(action.state).toStrictEqual({ status: "rejected", params: [], reason: new AbortError() });

      deferred = Promise.withResolvers();
      promise = action.run();
      (action.running as ActionRunningStatePending<unknown[], string>).abort();
      deferred.reject(new TestError());
      await expect(promise).rejects.toStrictThrow(new TestError());
      expect(action.state).toStrictEqual({ status: "rejected", params: [], reason: new AbortError() });
    });

    it("should ignore cancel after resolution", async () => {
      const deferred = Promise.withResolvers<string>();
      const action = new Action(() => deferred.promise);
      const promise = action.run();
      deferred.resolve("test");
      await promise;
      action.cancel();
      expect(action.state).toStrictEqual({ status: "resolved", params: [], value: "test" });
    });
  });

  describe("class CachedAction", () => {
    it("this.run() should not run callback twice with same params", async () => {
      const spy = jest.fn((param: number) => Promise.resolve(param));
      const action = new CachedAction(spy);
      await expect(action.run(1)).resolves.toBe(1);

      await expect(action.run(1)).resolves.toBe(1);
      expect(spy).toHaveBeenCalledTimes(1);

      await expect(action.run(2)).resolves.toBe(2);
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it("this.run() in pending state, should return same promise if params not changed", () => {
      const spy = jest.fn((_param: number) => 4);
      const action = new CachedAction(spy);
      const promise1 = action.run(1);
      const promise2 = action.run(1);
      expect(promise1).toBe(promise2);
    });

    it("this.run() should cancel current call if params different", async () => {
      let deferred = Promise.withResolvers<string>();
      const action = new CachedAction((_index: number) => deferred.promise);
      void action.run(1);
      deferred = Promise.withResolvers<string>();
      const promise = action.run(2);
      deferred.resolve("test");
      await promise;
      expect(action.state).toStrictEqual({ status: "resolved", params: [2], value: "test" });
    });

    it("this.run() should throw InvalidActionState", () => {
      let deferred = Promise.withResolvers<string>();
      const action = new CachedAction((_index: number) => deferred.promise);
      void action.run(1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      delete (action as any)._private_running.promise;
      deferred = Promise.withResolvers<string>();
      expect(() => action.run(2)).toStrictThrow(new InvalidActionState());
    });
  });
});
