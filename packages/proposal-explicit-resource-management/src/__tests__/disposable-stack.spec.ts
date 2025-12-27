import "../global";
import "../types";

import { describe, expect, it, jest } from "@jest/globals";

describe("Explicit resource management proposal", () => {
  describe("DisposableStack", () => {
    it("should be constructible", () => {
      expect(new DisposableStack()).toBeInstanceOf(DisposableStack);
      // @ts-expect-error: Did you mean to include 'new'
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      expect(() => DisposableStack()).toThrow("Class constructor DisposableStack cannot be invoked without 'new'");
      expect(new DisposableStack()[Symbol.toStringTag]).toBe("DisposableStack");
    });

    it("should properly state disposed", () => {
      const stack = new DisposableStack();
      expect(stack.disposed).toBe(false);

      stack.dispose();
      expect(stack.disposed).toBe(true);
    });

    it("use should schedule disposable value for dispose, throw for non disposable values, and skip null or undefined values", () => {
      const stack = new DisposableStack();
      const disposable = { [Symbol.dispose]: jest.fn() };
      expect(stack.use(disposable)).toBe(disposable);
      expect(stack.use(null)).toBeNull();
      expect(stack.use(undefined)).toBeUndefined();
      expect(() => stack.use({} as never)).toThrow("[Symbol.dispose] is not a function");

      stack.dispose();
      expect(disposable[Symbol.dispose]).toHaveBeenCalledWith();

      expect(() => stack.use(null)).toThrow("DisposableStack already disposed");
    });

    it("defer should schedule function for dispose", () => {
      const stack = new DisposableStack();
      const disposable = jest.fn();
      stack.defer(disposable);

      stack.dispose();
      expect(disposable).toHaveBeenCalledWith();

      expect(() => stack.defer(disposable)).toThrow("DisposableStack already disposed");
    });

    it("adopt should schedule value for dispose with specific dispose method", () => {
      const stack = new DisposableStack();
      const value = { type: "test-value" };
      const disposable = jest.fn();
      expect(stack.adopt(value, disposable)).toBe(value);

      stack.dispose();
      expect(disposable).toHaveBeenCalledWith(value);

      expect(() => stack.adopt(value, disposable)).toThrow("DisposableStack already disposed");
    });

    it("should suppress errors dispose", () => {
      const stack = new DisposableStack();
      const disposableWithError = (() => {
        let i = 0;
        return () => () => {
          throw new Error(`Test error ${(i += 1)}`);
        };
      })();

      stack.defer(disposableWithError());
      stack.defer(disposableWithError());
      stack.defer(disposableWithError());

      expect(() => stack.dispose()).toThrow(
        new SuppressedError(new Error("Test error 3"), new SuppressedError(new Error("Test error 2"), new Error("Test error 1"))),
      );
    });

    it("should not throw error on second dispose, but should do nothing", () => {
      const stack = new DisposableStack();
      const disposable = jest.fn();
      stack.defer(disposable);
      stack.dispose();
      disposable.mockClear();

      expect(() => stack.dispose()).not.toThrow();
      expect(disposable).not.toHaveBeenCalled();
    });

    it("should implement dispose protocol", () => {
      const stack = new DisposableStack();
      const disposable = jest.fn();
      stack.defer(disposable);
      stack[Symbol.dispose]();

      expect(disposable).toHaveBeenCalledWith();
    });

    describe("move", () => {
      function prepare() {
        const initiatedDisposer = { current: null as DisposableStack | null };
        const disposable1 = jest.fn();
        const inbetween = jest.fn(() => {});
        const disposable2 = jest.fn();

        const moveTest = () => {
          using errorDisposer = new DisposableStack();
          errorDisposer.defer(disposable1);
          inbetween();
          errorDisposer.defer(disposable2);
          initiatedDisposer.current = errorDisposer.move();
        };
        return { initiatedDisposer, disposable1, disposable2, inbetween, moveTest };
      }

      it("should create new DisposableStack and dispose current", () => {
        const { initiatedDisposer, disposable1, disposable2, moveTest } = prepare();

        moveTest();
        expect(disposable1).not.toHaveBeenCalled();
        expect(disposable2).not.toHaveBeenCalled();
        jest.clearAllMocks();
        initiatedDisposer.current!.dispose();
        expect(disposable1).toHaveBeenCalledWith();
        expect(disposable2).toHaveBeenCalledWith();
      });

      it("should dispose already initiated on error", () => {
        const { initiatedDisposer, disposable1, disposable2, moveTest, inbetween } = prepare();
        inbetween.mockImplementation(() => {
          throw new Error("test error");
        });

        expect(moveTest).toThrow("test error");
        expect(disposable1).toHaveBeenCalledWith();
        expect(disposable2).not.toHaveBeenCalled();
        expect(initiatedDisposer.current).toBeNull();
      });

      it("should not move already disposed stack", () => {
        const stack = new DisposableStack();
        stack.dispose();
        expect(() => stack.move()).toThrow("DisposableStack already disposed");
      });
    });
  });
});
