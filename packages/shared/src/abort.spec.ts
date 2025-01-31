import "./abort";

import { describe, expect, it, jest } from "@jest/globals";

import { isPromisePending } from "./promise";

describe("abort utils", () => {
  describe("AbortSignal extensions", () => {
    describe(".handle()", () => {
      it("should handle aborted signal", () => {
        const stub = jest.fn();
        const controller = new AbortController();
        controller.abort(new Error("test error"));
        controller.signal.handle(stub);
        expect(stub).toHaveBeenCalledWith(new Error("test error"));
      });

      it("should call onAborted when signal will be aborted", () => {
        const stub = jest.fn();
        const controller = new AbortController();
        controller.signal.handle(stub);
        controller.abort(new Error("test error"));
        expect(stub).toHaveBeenCalledWith(new Error("test error"));
      });
    });

    describe(".promise()", () => {
      it("should create promise and reject it on abort", async () => {
        const controller = new AbortController();
        const promise = controller.signal.promise();
        await expect(isPromisePending(promise)).resolves.toBe(true);
        controller.abort(new Error("test error"));
        await expect(promise).rejects.toThrow(new Error("test error"));
      });
    });
  });

  describe("AbortController extensions", () => {
    describe(".bindToSignal()", () => {
      it("should bind controller to another signal", () => {
        const original = new AbortController();
        const controller = new AbortController();
        controller.bindToSignal(original.signal);
        original.abort(new Error("test error"));
        expect(controller.signal.aborted).toBe(true);
        expect(controller.signal.reason).toStrictEqual(new Error("test error"));
      });
    });

    describe(".bindToPromise()", () => {
      it("should bind controller to another signal", async () => {
        const deferred = Promise.withResolvers();
        const controller = new AbortController();
        controller.bindToPromise(deferred.promise);
        deferred.reject(new Error("test error"));
        await Promise.resolve();
        expect(controller.signal.aborted).toBe(true);
        expect(controller.signal.reason).toStrictEqual(new Error("test error"));
      });
    });
  });
});
