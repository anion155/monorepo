import { describe, expect, it, jest } from "@jest/globals";

import { AsyncDisposableStack } from "../async-disposable-stack";
import { SuppressedError } from "../suppressed-error";

describe("Explicit resource management proposal", () => {
  describe("AsyncDisposableStack", () => {
    it("should be constructible", () => {
      expect(new AsyncDisposableStack()).toBeInstanceOf(AsyncDisposableStack);
      // @ts-expect-error: Did you mean to include 'new'
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      expect(() => AsyncDisposableStack()).toThrow("Class constructor AsyncDisposableStack cannot be invoked without 'new'");
      expect(new AsyncDisposableStack()[Symbol.toStringTag]).toBe("AsyncDisposableStack");
    });

    it("should properly state disposed", async () => {
      const stack = new AsyncDisposableStack();
      expect(stack.disposed).toBe(false);

      await stack.disposeAsync();
      expect(stack.disposed).toBe(true);
    });

    it("use should schedule disposable value for dispose, throw for non disposable values, and skip null or undefined values", async () => {
      const stack = new AsyncDisposableStack();
      const disposable = { [Symbol.dispose]: jest.fn() };
      const asyncDisposable = { [Symbol.asyncDispose]: jest.fn(async () => {}) };
      expect(stack.use(disposable)).toBe(disposable);
      expect(stack.use(asyncDisposable)).toBe(asyncDisposable);
      expect(stack.use(null)).toBeNull();
      expect(stack.use(undefined)).toBeUndefined();
      expect(() => stack.use({} as never)).toThrow("undefined is not a function");
      expect(() => stack.use({ [Symbol.asyncDispose]: undefined as never })).toThrow("undefined is not a function");

      await stack.disposeAsync();
      expect(disposable[Symbol.dispose]).toHaveBeenCalledWith();
      expect(asyncDisposable[Symbol.asyncDispose]).toHaveBeenCalledWith();

      expect(() => stack.use(null)).toThrow("AsyncDisposableStack already disposed");
    });

    it("defer should schedule function for dispose", async () => {
      const stack = new AsyncDisposableStack();
      const disposable = jest.fn(() => {});
      const asyncDisposable = jest.fn(async () => {});
      stack.defer(disposable);
      stack.defer(asyncDisposable);

      await stack.disposeAsync();
      expect(disposable).toHaveBeenCalledWith();
      expect(asyncDisposable).toHaveBeenCalledWith();

      expect(() => stack.defer(disposable)).toThrow("AsyncDisposableStack already disposed");
    });

    it("adopt should schedule value for dispose with specific dispose method", async () => {
      const stack = new AsyncDisposableStack();
      const value = { type: "test-value" };
      const disposable = jest.fn(() => {});
      const asyncDisposable = jest.fn(async () => {});
      expect(stack.adopt(value, disposable)).toBe(value);
      expect(stack.adopt(value, asyncDisposable)).toBe(value);

      await stack.disposeAsync();
      expect(disposable).toHaveBeenCalledWith(value);
      expect(asyncDisposable).toHaveBeenCalledWith(value);

      expect(() => stack.adopt(value, disposable)).toThrow("AsyncDisposableStack already disposed");
    });

    it("should suppress errors dispose", async () => {
      const stack = new AsyncDisposableStack();
      stack.defer(() => Promise.reject(new Error("Test error 1")));
      stack.defer(() => Promise.reject(new Error("Test error 2")));
      stack.defer(() => Promise.reject(new Error("Test error 3")));

      await expect(stack.disposeAsync()).rejects.toThrow(
        new SuppressedError(new Error("Test error 1"), new SuppressedError(new Error("Test error 2"), new Error("Test error 3"))),
      );
    });

    it("should not throw error on second dispose, but should do nothing", async () => {
      const stack = new AsyncDisposableStack();
      const disposable = jest.fn(async () => {});
      stack.defer(disposable);
      await stack.disposeAsync();
      disposable.mockClear();

      await expect(stack.disposeAsync()).resolves.toBeUndefined();
      expect(disposable).not.toHaveBeenCalled();
    });

    it("should implement async dispose protocol", async () => {
      const stack = new AsyncDisposableStack();
      const disposable = jest.fn(async () => {});
      stack.defer(disposable);
      await stack[Symbol.asyncDispose]();

      expect(disposable).toHaveBeenCalledWith();
    });

    describe("move", () => {
      function prepare() {
        const initiatedDisposer = { current: null as AsyncDisposableStack | null };
        const disposable1 = jest.fn(async () => {});
        const inbetween = jest.fn(async () => {});
        const disposable2 = jest.fn(async () => {});

        const moveTest = async () => {
          await using errorDisposer = new AsyncDisposableStack();
          errorDisposer.defer(disposable1);
          await inbetween();
          errorDisposer.defer(disposable2);
          initiatedDisposer.current = errorDisposer.move();
        };
        return { initiatedDisposer, disposable1, disposable2, inbetween, moveTest };
      }

      it("should create new AsyncDisposableStack and dispose current", async () => {
        const { initiatedDisposer, disposable1, disposable2, moveTest } = prepare();

        await moveTest();
        expect(disposable1).not.toHaveBeenCalled();
        expect(disposable2).not.toHaveBeenCalled();
        jest.clearAllMocks();
        await initiatedDisposer.current!.disposeAsync();
        expect(disposable1).toHaveBeenCalledWith();
        expect(disposable2).toHaveBeenCalledWith();
      });

      it("should dispose already initiated on error", async () => {
        const { initiatedDisposer, disposable1, disposable2, moveTest, inbetween } = prepare();
        inbetween.mockImplementation(() => Promise.reject(new Error("test error")));

        await expect(moveTest()).rejects.toThrow("test error");
        expect(disposable1).toHaveBeenCalledWith();
        expect(disposable2).not.toHaveBeenCalled();
        expect(initiatedDisposer.current).toBeNull();
      });

      it("should not move already disposed stack", async () => {
        const stack = new AsyncDisposableStack();
        await stack.disposeAsync();
        expect(() => stack.move()).toThrow("AsyncDisposableStack already disposed");
      });
    });
  });
});
