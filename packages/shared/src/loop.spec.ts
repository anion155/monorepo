import "./global/promise";

import { describe, expect, it, jest } from "@jest/globals";

import { Loop, LoopInvalidScheduler } from "./loop";
import { createTimeoutScheduler, immidiateScheduler } from "./scheduler";

describe("new Loop()", () => {
  it("should call spy in a loop", async () => {
    const spy = jest.fn((_signal: AbortSignal) => {});
    using loop = new Loop(createTimeoutScheduler(10), spy);
    await Promise.delay(10);
    expect(loop.running).toBe(true);
    expect(spy).toHaveBeenCalledWith(expect.any(AbortSignal));
    expect(spy).toHaveBeenCalledTimes(1);
    await Promise.delay(10);
    expect(spy).toHaveBeenCalledTimes(2);
    loop.stop();
    expect(loop.running).toBe(false);
    await Promise.delay(10);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("should not immidiately start Loop", async () => {
    const spy = jest.fn((_signal: AbortSignal) => {});
    using loop = new Loop(createTimeoutScheduler(10), spy, true);
    expect(loop.running).toBe(false);
    await Promise.delay(10);
    expect(spy).not.toHaveBeenCalled();
    loop.start();
    expect(loop.running).toBe(true);
    expect(spy).toHaveBeenCalledTimes(0);
    await Promise.delay(10);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("should create with delay param", async () => {
    const spy = jest.fn((_signal: AbortSignal) => {});
    using _loop = new Loop(10, spy);
    await Promise.delay(10);
    expect(spy).toHaveBeenCalledTimes(1);
    await Promise.delay(10);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("should create with not cancelable scheduler", () => {
    const spy = jest.fn((_signal: AbortSignal) => {});
    const queue = [] as { (): void }[];
    const loop = new Loop({ schedule: (fn) => queue.push(fn) }, spy);
    expect(queue.length).toBe(1);
    expect(spy).toHaveBeenCalledTimes(0);
    queue.shift()!();
    expect(queue.length).toBe(1);
    expect(spy).toHaveBeenCalledTimes(1);
    loop.stop();
    queue.shift()!();
    expect(queue.length).toBe(0);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("should let user handle error", async () => {
    const loop = new Loop(10, () => {
      throw new Error("testerror");
    });
    /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
    expect((loop as any)._private_running).toBeTruthy();
    const spy = jest.fn();
    loop.on("error", spy);
    await Promise.delay(10);
    expect((loop as any)._private_running).toBe(false);
    expect(spy).toHaveBeenCalledWith(new Error("testerror"));
    /* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
  });

  it.skip("should throw unhandled error", async () => {
    const deferred = Promise.withResolvers();
    process.setUncaughtExceptionCaptureCallback((reason) => {
      deferred.reject(reason);
    });
    // FIXME: does not work with sync fn
    const loop = new Loop(10, async () => {
      return Promise.reject(new Error("testerror"));
    });
    await Promise.delay(10);
    await expect(deferred.promise).rejects.toStrictThrow(new Error("testerror"));
  });

  it("should handle async task", async () => {
    let deferred = Promise.withResolvers<void>();
    const spy = jest.fn((_signal: AbortSignal) => deferred.promise);
    const queue = [] as { (): void }[];
    const loop = new Loop({ schedule: (fn) => queue.push(fn) }, spy);
    expect(queue.length).toBe(1);
    expect(spy).toHaveBeenCalledTimes(0);
    queue.shift()!();
    expect(queue.length).toBe(0);
    expect(spy).toHaveBeenCalledTimes(1);
    deferred.resolve();
    await deferred.promise;
    expect(queue.length).toBe(1);
    expect(spy).toHaveBeenCalledTimes(1);
    deferred = Promise.withResolvers();
    queue.shift()!();
    loop.stop();
    deferred.resolve();
    await deferred.promise;
    expect(queue.length).toBe(0);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("should emit tick and tick event", async () => {
    const spy = jest.fn((_signal: AbortSignal) => {});
    using loop = new Loop(10);
    loop.on("tick", spy);
    expect(spy).toHaveBeenCalledTimes(0);
    await Promise.delay(10);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("should stop on dispose", async () => {
    const spy = jest.fn((_signal: AbortSignal) => {});
    {
      using _loop = new Loop(10, spy);
      expect(spy).toHaveBeenCalledTimes(0);
      await Promise.delay(10);
      expect(spy).toHaveBeenCalledTimes(1);
    }
    await Promise.delay(10);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("should throw error with immidiateScheduler", () => {
    expect(() => new Loop(immidiateScheduler)).toStrictThrow(new LoopInvalidScheduler("Can not create Loop with immidiate scheduler"));
  });
});
