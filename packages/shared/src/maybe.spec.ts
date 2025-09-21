import { describe, expect, it, jest } from "@jest/globals";

import { DeveloperError } from "./errors";
import type { MaybeState } from "./maybe";
import { Maybe } from "./maybe";

describe("class Maybe", () => {
  it("should not let instantiate Maybe", () => {
    expect(() => new Maybe()).toThrow(new DeveloperError("Maybe's constructor is not supported"));
  });

  it("should not let instantiate Maybe with Promise value", () => {
    const maybeConstructorFlag = Symbol.for("Maybe#constructor");
    const MaybeConstructor = Maybe as {
      new <Value>(flag: typeof maybeConstructorFlag, state: MaybeState<Value>): Maybe<Value>;
    };
    expect(() => new MaybeConstructor(maybeConstructorFlag, { status: "resolved", value: Promise.resolve() })).toThrow(
      new DeveloperError("Maybe does not support nested Promise"),
    );
  });

  it("Maybe.resolve(value) should instantiate resolved Maybe", () => {
    const maybe = Maybe.resolve(5);
    expect(maybe).toBeInstanceOf(Maybe);
    expect(maybe.unwrap()).toBe(5);
  });

  it("Maybe.resolve(promise) should instantiate Promise", async () => {
    const result = Maybe.resolve(Promise.resolve(5));
    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toBe(5);
  });

  it("Maybe.resolve(maybe) should instantiate Maybe with nested value", () => {
    const result = Maybe.resolve(Maybe.resolve(5));
    expect(result).toBeInstanceOf(Maybe);
    expect(result.unwrap()).toBe(5);
  });

  it("Maybe.reject() should instantiate rejected Maybe", () => {
    const maybe = Maybe.reject(new Error("test error"));
    expect(maybe).toBeInstanceOf(Maybe);
    expect(() => maybe.unwrap()).toThrow(new Error("test error"));
  });

  it("Maybe.try() should instantiate Maybe from result of Maybe", async () => {
    const value = Maybe.try(() => 5);
    expect(value).toBeInstanceOf(Maybe);
    expect(value.unwrap()).toBe(5);

    const error = Maybe.try(() => {
      throw new Error("test error");
    });
    expect(error).toBeInstanceOf(Maybe);
    expect(() => error.unwrap()).toThrow(new Error("test error"));

    const resolved = Maybe.try(async () => Promise.resolve(5));
    expect(resolved).toBeInstanceOf(Promise);
    await expect(resolved).resolves.toBe(5);

    const rejected = Maybe.try(async () => Promise.reject(new Error("test error")));
    expect(rejected).toBeInstanceOf(Promise);
    await expect(rejected).rejects.toThrow(new Error("test error"));
  });

  it(".then() should project Maybe value", async () => {
    const expectMaybe = (something: unknown) => {
      expect(something).toBeInstanceOf(Maybe);
      return something as Maybe<unknown>;
    };
    const expectPromise = (something: unknown) => {
      expect(something).toBeInstanceOf(Promise);
      return something as Promise<unknown>;
    };

    const value = Maybe.resolve(5);
    expect(expectMaybe(value.then((value) => value * 2)).unwrap()).toBe(10);
    await expect(expectPromise(value.then(async () => Promise.resolve(10)))).resolves.toBe(10);
    expect(
      expectMaybe(
        value.then(
          (value) => value * 2,
          () => 0,
        ),
      ).unwrap(),
    ).toBe(10);
    expect(expectMaybe(value.then(undefined, () => 0)).unwrap()).toBe(5);
    expect(expectMaybe(value.then(undefined, async () => Promise.reject(new Error("test error")))).unwrap()).toBe(5);

    const error = Maybe.reject(new Error("test error"));
    expect(() => expectMaybe(error.then((value) => value * 2)).unwrap()).toThrow(new Error("test error"));
    expect(() => expectMaybe(error.then(async () => Promise.resolve(10))).unwrap()).toThrow(new Error("test error"));
    expect(
      error
        .then(
          (value) => value * 2,
          () => 0,
        )
        .unwrap(),
    ).toBe(0);
    expect(error.then(undefined, () => 0).unwrap()).toBe(0);
    await expect(expectPromise(error.then(undefined, async () => Promise.reject(new Error("another error"))))).rejects.toThrow(
      new Error("another error"),
    );
  });

  it(".catch() should project rejected Maybe", () => {
    const expectMaybe = (something: unknown) => {
      expect(something).toBeInstanceOf(Maybe);
      return something as Maybe<unknown>;
    };
    expect(expectMaybe(Maybe.resolve(5).catch(() => 10)).unwrap()).toBe(5);
    expect(expectMaybe(Maybe.reject(new Error("test error")).catch(() => 10)).unwrap()).toBe(10);
  });

  it(".finally() should run handler", () => {
    const expectMaybe = (something: unknown) => {
      expect(something).toBeInstanceOf(Maybe);
      return something as Maybe<unknown>;
    };
    const handler = jest.fn();
    expectMaybe(Maybe.resolve(5).finally(handler));
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenLastCalledWith();
    expectMaybe(Maybe.reject(new Error("test error")).finally(handler));
    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenLastCalledWith();
  });

  it("should be compatible with async/await syntax", async () => {
    const value = Maybe.resolve(5);
    await expect(value).resolves.toBe(5);
    expect(await value).toBe(5);

    const error = Maybe.reject(new Error("test error"));
    await expect(error).rejects.toThrow(new Error("test error"));
    try {
      await error;
      throw new Error("unreachable");
    } catch (error) {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(error).toStrictEqual(new Error("test error"));
    }
  });
});
