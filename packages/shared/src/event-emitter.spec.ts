import { describe, expect, it, jest } from "@jest/globals";

import { EventEmitter } from "./event-emitter";
import { immidiateScheduler } from "./scheduler";

describe("class EventEmitter", () => {
  it("should implement emitter", () => {
    const emitter = new EventEmitter(immidiateScheduler);
    const listener1 = jest.fn();
    const listener2 = jest.fn();
    const listener3 = jest.fn();
    emitter.on("test", listener1);
    emitter.on("test", listener2);
    emitter.on("other", listener3);

    emitter.emit("test", 1, 2);
    expect(listener1).toHaveBeenCalledWith(1, 2);
    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledWith(1, 2);
    expect(listener2).toHaveBeenCalledTimes(1);

    emitter.off("test", listener2);
    emitter.emit("test");
    expect(listener1).toHaveBeenCalledTimes(2);
    expect(listener2).toHaveBeenCalledTimes(1);
  });

  it("should use asyncScheduler as default", async () => {
    const emitter = new EventEmitter();
    const listener = jest.fn();
    emitter.on("test", listener);
    emitter.emit("test");
    expect(listener).toHaveBeenCalledTimes(0);
    await Promise.resolve();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it(".on() should return function that offs same listener", () => {
    const emitter = new EventEmitter(immidiateScheduler);
    const listener = jest.fn();
    emitter.on("test", listener)();
    emitter.emit("test", 1, 2);
    expect(listener).toHaveBeenCalledTimes(0);
  });

  it(".emit() should handle no listeners", () => {
    const emitter = new EventEmitter(immidiateScheduler);
    expect(() => emitter.emit("test", 1, 2)).not.toThrow();
  });

  it("events.test() should emit test event", () => {
    const emitter = new EventEmitter(immidiateScheduler);
    const listener = jest.fn();
    emitter.on("test", listener);
    emitter.events.test(1, 2);
    expect(listener).toHaveBeenCalledWith(1, 2);
  });

  it("events.test should be cached", () => {
    const emitter = new EventEmitter(immidiateScheduler);
    const test1 = emitter.events.test;
    const test2 = emitter.events.test;
    expect(test1).toBe(test2);
  });
});
