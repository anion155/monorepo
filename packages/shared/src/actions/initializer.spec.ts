import { describe, expect, it, jest } from "@jest/globals";

import { doThrow } from "../do";
import { createErrorClass } from "../errors";
import { liftContext } from "../functional";
import { InvalidActionState } from "./action";
import { Initializer, NotInitialized } from "./initializer";

describe("class Initializer", () => {
  it("should initialize once", async () => {
    const spy = jest.fn((..._params: unknown[]) => ({}));
    const init = new Initializer(spy);
    const result1 = await init.run(1, 2);
    expect(spy.mock.calls).toStrictEqual([[1, 2]]);

    const result2 = await init.run(1, 2);
    expect(spy.mock.calls).toStrictEqual([[1, 2]]);

    const result3 = await init.run(2, 3);
    expect(spy.mock.calls).toStrictEqual([
      [1, 2],
      [2, 3],
    ]);

    expect(result1).toBe(result2);
    expect(result2).not.toBe(result3);
  });

  it("in pending state, should return previous promise with same params", () => {
    const spy = jest.fn((..._params: unknown[]) => 5);
    const init = new Initializer(spy);
    const promise1 = init.run(1, 2);
    const promise2 = init.run(1, 2);
    expect(promise1).toBe(promise2);
  });

  it("in pending state, should return new promise with new params", () => {
    const spy = jest.fn((..._params: unknown[]) => 5);
    const init = new Initializer(spy);
    const promise1 = init.run(1, 2);
    const promise2 = init.run(2, 3);
    expect(promise1).not.toBe(promise2);
  });

  it("in pending state, should detect invalid state", () => {
    let deferred = Promise.withResolvers<string>();
    const spy = jest.fn((..._params: unknown[]) => deferred.promise);
    const init = new Initializer(spy);
    void init.run(1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    delete (init as any)._private_running.promise;
    deferred = Promise.withResolvers<string>();
    expect(() => init.run(2)).toStrictThrow(new InvalidActionState());
  });

  it("this.initialized should return initialized state", async () => {
    const init = new Initializer(() => 5);
    expect(init.initialized).toBe(false);
    await init.run();
    expect(init.initialized).toBe(true);
  });

  it("this.value should return initialized value", async () => {
    const init = new Initializer(() => 5);
    expect(() => init.value).toStrictThrow(new NotInitialized("this value is not initialized yet"));
    await init.run();
    expect(init.value).toBe(5);
  });

  it("this.deferred should return deferred promise", async () => {
    const init = new Initializer(() => 5);
    const promise = init.deferred;
    await init.run();
    await expect(promise).resolves.toBe(5);
  });

  it("this.dispose() should dispose stack", async () => {
    const spy = jest.fn();
    const init = new Initializer(liftContext(({ stack }) => stack.append(spy)));
    await init.dispose();
    expect(spy).not.toHaveBeenCalled();
    await init.run();
    await init.dispose();
    expect(spy.mock.calls).toStrictEqual([[]]);
  });

  it("should catch callback error and dispose errors", async () => {
    class TestError extends createErrorClass("TestError") {}

    const init1 = new Initializer(() => doThrow(new TestError("1")));
    await expect(init1.run()).rejects.toStrictThrow(new TestError("1"));

    const init2 = new Initializer(
      liftContext(({ stack }) => {
        stack.append(() => doThrow(new TestError("2")));
        throw new TestError("1");
      }),
    );
    await expect(init2.run()).rejects.toStrictThrow(new SuppressedError(new TestError("2"), new TestError("1")));
  });
});
