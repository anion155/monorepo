import { describe, expect, it, jest } from "@jest/globals";

import {
  cloneCallable,
  curryHelper,
  hoistCallable,
  identity,
  liftContext,
  nameCallable,
  noop,
  pipe,
  proxyCallable,
  reduce,
  wrapCallable,
} from "./functional";

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

  describe("nameCallable()", () => {
    it("should define function name", () => {
      const fn = function test() {};
      nameCallable("test-changed", fn);
      expect(fn.name).toBe("test-changed");
    });
  });

  describe("proxyCallable()", () => {
    it("should properly call passed function", () => {
      const spy = jest.fn<(this: unknown, ...params: unknown[]) => string>(() => "test");
      const fn = proxyCallable<InferFunctorSign<typeof spy>>(
        (call) =>
          function (this: unknown, ...params: unknown[]): string {
            return call(spy, [this, ...params] as never, this, new.target) as never;
          },
      );
      const context = { type: "test-context" };

      expect(fn.call(context, 1, "b")).toBe("test");
      expect(spy).toHaveBeenCalledWith(context, 1, "b");

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
      expect(new (fn as any)(2, "c")).toBeInstanceOf(spy);
      expect(spy).toHaveBeenCalledWith({}, 2, "c");
    });
  });

  describe("cloneCallable()", () => {
    it("must clone passed function", () => {
      const spy = jest.fn<(this: unknown, ...params: unknown[]) => string>(() => "test");
      const test = cloneCallable(spy as Functor<unknown[], unknown>);
      expect(test).not.toBe(spy);
      expect("mock" in test).toBe(false);
      expect(test(1, "a")).toBe("test");
      expect(spy).toHaveBeenCalledWith(1, "a");
    });
  });

  describe("hoistCallable()", () => {
    it("should hoist source fields", () => {
      const spy = jest.fn();
      const source = function source() {
        spy();
        return 5;
      };
      source.original = "hoisted-test";
      source.value = "hoisted-test";
      const hoisted = () => 10;
      hoisted.value = "override-test";
      hoisted.hoisted = "override-test";
      const fn = hoistCallable(source, hoisted);
      expect(fn).not.toBe(source);
      expect(Object.prototype.isPrototypeOf.call(source, fn)).toBe(true);
      expect(fn.name).toBe("source");
      expect(fn.original).toBe("hoisted-test");
      expect(fn.value).toBe("override-test");
      expect(fn.hoisted).toBe("override-test");
      expect(fn()).toBe(10);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe("wrapCallable()", () => {
    it("should wrap function", () => {
      const orig = jest.fn((..._params: unknown[]) => "original-test");
      Object.defineProperty(orig, "name", { value: "original-test", configurable: true });
      Object.defineProperty(orig, "original", { value: "original-test", configurable: true });
      Object.defineProperty(orig, "value", { value: "original-test", configurable: true });
      const wrapped = wrapCallable<
        { (...params: unknown[]): unknown; original: string; value: string },
        { (...params: unknown[]): unknown; wrapped: string }
      >(
        orig as never,
        (call) => Object.assign(() => `wrapped-${call() as string}`, { wrapped: "wrapped-test", value: "wrapped-test" }),
        "wrapped-test",
      );
      expect(wrapped.name).toBe("wrapped-test");
      expect(wrapped.value).toBe("wrapped-test");
      expect(wrapped.original).toBe("original-test");
      expect(wrapped.wrapped).toBe("wrapped-test");
      expect(wrapped()).toBe("wrapped-original-test");
      orig.mockReturnValueOnce("55");
      expect(wrapped()).toBe("wrapped-55");
    });

    it("should be able to wrap params", () => {
      const wrapped = wrapCallable<(a: number, b: string) => string, (a: number) => string>(
        (a: number, b: string) => `${a}-${b}`,
        (call, getContext) => (a: number) => `wrapped-${call([a, String(a * 10)], getContext())}`,
      );
      expect(wrapped(1)).toBe("wrapped-1-10");
    });
  });

  describe("liftContext()", () => {
    it("should provide context and arguments", () => {
      const mock = jest.fn((..._params: unknown[]) => "test");
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

  describe("pipe()", () => {
    it("should create pipe", () => {
      const piped = pipe((a: string, b: number) => ({
        test(c: string) {
          return (b + a + c).length;
        },
      }))
        .method("test", "5")
        .pipe((length) => Array.from({ length }, (_, i) => i));
      expect(piped("test", 5)).toStrictEqual([0, 1, 2, 3, 4, 5]);
    });
  });

  describe("reduce()", () => {
    it("should reduce", () => {
      const result = reduce([1, 2, 3], (acc, value) => `${acc}-${value}`, "");
      expect(result).toBe("-1-2-3");
    });

    it("should handle empty array", () => {
      const result = reduce([] as number[], (acc, value) => `${acc}-${value}`, "");
      expect(result).toBe("");
    });

    it("should handle reduced value", () => {
      const result = reduce(
        [1, 2, 3],
        (acc, value, index, reduce) => {
          if (index === 2) reduce(acc);
          return `${acc}-${value}`;
        },
        "",
      );
      expect(result).toBe("-1-2");
    });

    it("should handle error", () => {
      expect(() =>
        reduce(
          [1, 2, 3],
          (acc, value, index) => {
            if (index === 2) throw new Error("test error");
            return `${acc}-${value}`;
          },
          "",
        ),
      ).toThrow(new Error("test error"));
    });
  });

  describe("reduce.plain()", () => {
    it("should reduce", () => {
      const result = reduce.plain([1, 2, 3], (acc, value) => acc + value);
      expect(result).toBe(6);
    });

    it("should throw too short error", () => {
      expect(() => reduce.plain([] as number[], (acc, value) => acc + value)).toThrow(new TypeError("reduce.plain can't handle empty iterable"));
    });
  });
});
