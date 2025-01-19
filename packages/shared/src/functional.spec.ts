import { describe, expect, it, jest } from "@jest/globals";
import { clone, curryHelper, identity, liftContext, noop, wrapFunctor } from "./functional";

describe("functional utils", () => {
  describe("noop()", () => {
    it("should return undefined", () => {
      expect(noop()).toBeUndefined();
    });
  });

  describe("identity()", () => {
    it("should return same value", () => {
      const item = Symbol.for("blah");
      expect(identity(item)).toBe(item);
    });
  });

  describe("clone()", () => {
    it("should return same value", () => {
      const orig = jest.fn().mockReturnValue("result");
      const cloned = clone(orig);
      expect(cloned).not.toBe(orig);
      expect(cloned(1, "2")).toBe("result");
      expect(orig).toHaveBeenCalledWith(1, "2");
    });
  });

  describe("wrapFunctor()", () => {
    it("should return same value", () => {
      const orig = jest.fn((..._args: unknown[]) => "test");
      Object.defineProperty(orig, "name", { value: "test", configurable: true });
      const wrapped = wrapFunctor(
        orig,
        Object.assign((...args: unknown[]) => orig(...args), { test: "test" }),
      );
      expect(wrapped.name).toBe("test");
      expect(wrapped()).toBe("test");
      expect(wrapped.test).toBe("test");
      wrapped.mockReturnValueOnce("55");
      expect(wrapped()).toBe("55");
    });
  });

  describe("liftContext()", () => {
    it("should provide context and arguments", () => {
      const mock = jest.fn(() => "test");
      const lifted = liftContext(mock);
      expect(lifted.call({ type: "context" }, 2, "5")).toBe("test");
      expect(mock).toHaveBeenCalledWith({ type: "context" }, 2, "5");
    });
  });

  describe("curryHelper()", () => {
    it("should create helper function", () => {
      const fn = <A>() => curryHelper(<B>(modifier: (value: A) => B) => ["test", modifier] as const);
      expect(fn<string>()(Number)).toStrictEqual(["test", Number]);
      expect(fn<string>().curried(Number)).toStrictEqual(["test", Number]);
    });
  });
});
