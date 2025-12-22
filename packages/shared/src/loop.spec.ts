import "./global/promise";

import { describe, expect, it, jest } from "@jest/globals";

import { Loop, LoopImvalidScheduler } from "./loop";
import { createTimeoutScheduler, immidiateScheduler } from "./scheduler";

describe("new Loop()", () => {
  it("should call spy in a loop", async () => {
    const spy = jest.fn((_signal: AbortSignal) => {});
    using loop = new Loop(createTimeoutScheduler(10), spy);
    await Promise.delay(10);
    expect(spy).toHaveBeenCalledWith(expect.any(AbortSignal));
    expect(spy).toHaveBeenCalledTimes(1);
    await Promise.delay(10);
    expect(spy).toHaveBeenCalledTimes(2);
    loop.stop();
    await Promise.delay(10);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("should not immidiately start Loop", async () => {
    const spy = jest.fn((_signal: AbortSignal) => {});
    using loop = new Loop(createTimeoutScheduler(10), spy, true);
    await Promise.delay(10);
    expect(spy).not.toHaveBeenCalled();
    loop.start();
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

  it("should handle error", async () => {
    const loop = new Loop(10, () => {
      throw new Error("testerror");
    });
    /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
    expect((loop as any)._private_running).toBeTruthy();
    await Promise.delay(10);
    expect((loop as any)._private_running).toBe(false);
    /* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
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
    expect(() => new Loop(immidiateScheduler)).toStrictThrow(new LoopImvalidScheduler("Can not create Loop with immidiate scheduler"));
  });
});
