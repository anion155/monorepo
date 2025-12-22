import "./global/disposable";

import { describe, expect, it, jest } from "@jest/globals";

import { runIsolated } from "./jest/run-isolated";
import { createTimeoutScheduler, immidiateScheduler, promiseScheduler, timeoutScheduler } from "./scheduler";

describe("schedulers", () => {
  describe("immidiateScheduler", () => {
    it("should run fn immediately", () => {
      const spy = jest.fn<() => void>();
      immidiateScheduler.schedule(spy);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("should not cancel", () => {
      const spy = jest.fn<() => void>();
      const id = immidiateScheduler.schedule(spy);
      immidiateScheduler.cancel(id);
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe("microtaskScheduler", () => {
    it("should run fn after queueMicrotask", async () => {
      using module = runIsolated((stack) => {
        if (!("queueMicrotask" in globalThis)) {
          const queueMicrotask = (fn: () => void) => process.nextTick(fn);
          Object.defineProperty(globalThis, "queueMicrotask", { value: queueMicrotask, configurable: true, writable: true, enumerable: false });
          stack.append(() => {
            delete (globalThis as never as { queueMicrotask?: typeof queueMicrotask }).queueMicrotask;
          });
        }
        const queueMicrotask: (fn: () => void) => void = (globalThis as never as { queueMicrotask: typeof queueMicrotask }).queueMicrotask;
        const { microtaskScheduler } = require("./scheduler") as typeof import("./scheduler");
        return { queueMicrotask, microtaskScheduler };
      });
      const { queueMicrotask, microtaskScheduler } = module.value;
      const spy = jest.fn<() => void>();
      microtaskScheduler.schedule(spy);
      const deferred = Promise.withResolvers<void>();
      queueMicrotask(() => {
        expect(spy).toHaveBeenCalledTimes(1);
        deferred.resolve();
      });
      await deferred.promise;
      expect.assertions(1);
    });

    it("should cancel", async () => {
      using module = runIsolated((stack) => {
        if (!("queueMicrotask" in globalThis)) {
          const queueMicrotask = (fn: () => void) => process.nextTick(fn);
          Object.defineProperty(globalThis, "queueMicrotask", { value: queueMicrotask, configurable: true, writable: true, enumerable: false });
          stack.append(() => {
            delete (globalThis as never as { queueMicrotask?: typeof queueMicrotask }).queueMicrotask;
          });
        }
        const queueMicrotask: (fn: () => void) => void = (globalThis as never as { queueMicrotask: typeof queueMicrotask }).queueMicrotask;
        const { microtaskScheduler } = require("./scheduler") as typeof import("./scheduler");
        return { queueMicrotask, microtaskScheduler };
      });
      const { queueMicrotask, microtaskScheduler } = module.value;
      const spy = jest.fn<() => void>();
      const id = microtaskScheduler.schedule(spy);
      microtaskScheduler.cancel(id);
      const deferred = Promise.withResolvers<void>();
      queueMicrotask(() => {
        expect(spy).toHaveBeenCalledTimes(0);
        deferred.resolve();
      });
      await deferred.promise;
      expect.assertions(1);
    });

    it("without queueMicrotask should be undefined", () => {
      using module = runIsolated((stack) => {
        if ("queueMicrotask" in globalThis) {
          const queueMicrotask = Object.getOwnPropertyDescriptor(globalThis, "queueMicrotask")!;
          delete (globalThis as never as { queueMicrotask?: typeof queueMicrotask }).queueMicrotask;
          stack.append(() => Object.defineProperty(globalThis, "queueMicrotask", queueMicrotask));
        }
        const { microtaskScheduler } = require("./scheduler") as typeof import("./scheduler");
        return { microtaskScheduler };
      });
      const { microtaskScheduler } = module.value;
      expect(microtaskScheduler).toBe(undefined);
    });
  });

  describe("rafScheduler", () => {
    it("should run fn after requestAnimationFrame", async () => {
      using module = runIsolated((stack) => {
        if (!("requestAnimationFrame" in globalThis)) {
          const requestAnimationFrame = (fn: () => void) => {
            let waiting = true;
            process.nextTick(() => waiting && fn());
            return () => (waiting = false);
          };
          Object.defineProperty(globalThis, "requestAnimationFrame", {
            value: requestAnimationFrame,
            configurable: true,
            writable: true,
            enumerable: false,
          });
          const cancelAnimationFrame = (cancel: () => void) => cancel();
          Object.defineProperty(globalThis, "cancelAnimationFrame", {
            value: cancelAnimationFrame,
            configurable: true,
            writable: true,
            enumerable: false,
          });
          stack.append(() => {
            delete (globalThis as never as { requestAnimationFrame?: typeof requestAnimationFrame }).requestAnimationFrame;
            delete (globalThis as never as { cancelAnimationFrame?: typeof cancelAnimationFrame }).cancelAnimationFrame;
          });
        }
        const requestAnimationFrame: (fn: () => void) => void = (globalThis as never as { requestAnimationFrame: typeof requestAnimationFrame })
          .requestAnimationFrame;
        const { rafScheduler } = require("./scheduler") as typeof import("./scheduler");
        return { requestAnimationFrame, rafScheduler };
      });
      const { requestAnimationFrame, rafScheduler } = module.value;
      const spy = jest.fn<() => void>();
      rafScheduler.schedule(spy);
      const deferred = Promise.withResolvers<void>();
      requestAnimationFrame(() => {
        expect(spy).toHaveBeenCalledTimes(1);
        deferred.resolve();
      });
      await deferred.promise;
      expect.assertions(1);
    });

    it("should cancel", async () => {
      using module = runIsolated((stack) => {
        if (!("requestAnimationFrame" in globalThis)) {
          const requestAnimationFrame = (fn: () => void) => {
            let waiting = true;
            process.nextTick(() => waiting && fn());
            return () => (waiting = false);
          };
          Object.defineProperty(globalThis, "requestAnimationFrame", {
            value: requestAnimationFrame,
            configurable: true,
            writable: true,
            enumerable: false,
          });
          const cancelAnimationFrame = (cancel: () => void) => cancel();
          Object.defineProperty(globalThis, "cancelAnimationFrame", {
            value: cancelAnimationFrame,
            configurable: true,
            writable: true,
            enumerable: false,
          });
          stack.append(() => {
            delete (globalThis as never as { requestAnimationFrame?: typeof requestAnimationFrame }).requestAnimationFrame;
            delete (globalThis as never as { cancelAnimationFrame?: typeof cancelAnimationFrame }).cancelAnimationFrame;
          });
        }
        const requestAnimationFrame: (fn: () => void) => void = (globalThis as never as { requestAnimationFrame: typeof requestAnimationFrame })
          .requestAnimationFrame;
        const { rafScheduler } = require("./scheduler") as typeof import("./scheduler");
        return { requestAnimationFrame, rafScheduler };
      });
      const { requestAnimationFrame, rafScheduler } = module.value;
      const spy = jest.fn<() => void>();
      const id = rafScheduler.schedule(spy);
      rafScheduler.cancel(id);
      const deferred = Promise.withResolvers<void>();
      requestAnimationFrame(() => {
        expect(spy).toHaveBeenCalledTimes(0);
        deferred.resolve();
      });
      await deferred.promise;
      expect.assertions(1);
    });

    it("without requestAnimationFrame should be undefined", () => {
      using module = runIsolated((stack) => {
        if ("requestAnimationFrame" in globalThis) {
          const requestAnimationFrame = Object.getOwnPropertyDescriptor(globalThis, "requestAnimationFrame")!;
          delete (globalThis as never as { requestAnimationFrame?: typeof requestAnimationFrame }).requestAnimationFrame;
          stack.append(() => Object.defineProperty(globalThis, "requestAnimationFrame", requestAnimationFrame));
        }
        const { rafScheduler } = require("./scheduler") as typeof import("./scheduler");
        return { rafScheduler };
      });
      const { rafScheduler } = module.value;
      expect(rafScheduler).toBe(undefined);
    });
  });

  describe("createTimeoutScheduler()", () => {
    it("should run fn after timeout", async () => {
      const spy = jest.fn<() => void>();
      const timeoutScheduler = createTimeoutScheduler(10);
      timeoutScheduler.schedule(spy);
      const deferred = Promise.withResolvers<void>();
      setTimeout(() => {
        expect(spy).toHaveBeenCalledTimes(1);
        deferred.resolve();
      }, 10);
      await deferred.promise;
      expect.assertions(1);
    });

    it("should cancel", async () => {
      const spy = jest.fn<() => void>();
      const timeoutScheduler = createTimeoutScheduler(100);
      timeoutScheduler.cancel(timeoutScheduler.schedule(spy));
      const deferred = Promise.withResolvers<void>();
      setTimeout(() => {
        expect(spy).toHaveBeenCalledTimes(0);
        deferred.resolve();
      }, 200);
      await deferred.promise;
      expect.assertions(1);
    });
  });

  describe("timeoutScheduler", () => {
    it("should run fn after 0 timeout", async () => {
      const spy = jest.fn<() => void>();
      timeoutScheduler.schedule(spy);
      const deferred = Promise.withResolvers<void>();
      setTimeout(() => {
        expect(spy).toHaveBeenCalledTimes(1);
        deferred.resolve();
      }, 0);
      await deferred.promise;
      expect.assertions(1);
    });

    it("should cancel", async () => {
      const spy = jest.fn<() => void>();
      const id = timeoutScheduler.schedule(spy);
      timeoutScheduler.cancel(id);
      const deferred = Promise.withResolvers<void>();
      setTimeout(() => {
        expect(spy).toHaveBeenCalledTimes(0);
        deferred.resolve();
      }, 200);
      await deferred.promise;
      expect.assertions(1);
    });
  });

  describe("promiseScheduler", () => {
    it("should run fn after 0 timeout", async () => {
      const spy = jest.fn<() => void>();
      promiseScheduler.schedule(spy);
      await Promise.resolve();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("should cancel", async () => {
      const spy = jest.fn<() => void>();
      const id = timeoutScheduler.schedule(spy);
      timeoutScheduler.cancel(id);
      await Promise.resolve();
      expect(spy).toHaveBeenCalledTimes(0);
    });
  });
});
