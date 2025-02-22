import "./disposable";

import { describe, expect, it, jest } from "@jest/globals";

import { DeveloperError } from "@/errors";
import { isPromisePending } from "@/promise";

describe("disposable utils", () => {
  describe("Async/DisposableStack extensions", () => {
    const createDisposables = () => {
      const disposables = [new DisposableStack(), jest.fn(), null, undefined] as const;
      const exposeDisposed = () => {
        expect(disposables[1]).toHaveBeenCalledWith();
        expect(disposables[0].disposed).toBe(true);
        return true;
      };
      const dispose = (stack: DisposableStack) => {
        stack.dispose();
        return exposeDisposed;
      };
      return { disposables, dispose, exposeDisposed };
    };
    const createAsyncDisposables = () => {
      const { promise, resolve } = Promise.withResolvers();
      const disposables = [new DisposableStack(), jest.fn(() => promise), null, undefined, new AsyncDisposableStack()] as const;
      const expectDisposed = () => {
        expect(disposables[4].disposed).toBe(true);
        expect(disposables[1]).toHaveBeenCalledWith();
        expect(disposables[0].disposed).toBe(true);
        return true;
      };
      const dispose = async (stack: AsyncDisposableStack) => {
        const promise = stack.disposeAsync();
        await expect(isPromisePending(promise)).resolves.toBe(true);
        resolve();
        await promise;
        return expectDisposed();
      };
      return { disposables, dispose, resolve, expectDisposed };
    };

    describe(".throwIfDisposed() should throw when disposed", () => {
      it("sync", () => {
        const stack = new DisposableStack();
        expect(() => stack.throwIfDisposed()).not.toThrow();
        stack.dispose();
        // expect(undefined).toBePending();
        expect(() => stack.throwIfDisposed()).toThrow(new DeveloperError("trying to use disposed stack"));
      });

      it("async", async () => {
        const stack = new AsyncDisposableStack();
        expect(() => stack.throwIfDisposed()).not.toThrow();
        await stack.disposeAsync();
        expect(() => stack.throwIfDisposed()).toThrow(new DeveloperError("trying to use disposed stack"));
      });
    });

    describe(".append() should append disposables", () => {
      it("sync", () => {
        const { disposables, dispose } = createDisposables();
        const stack = new DisposableStack();
        stack.append(...disposables);
        expect(dispose(stack)).toBe(true);
      });

      it("async", async () => {
        const stack = new AsyncDisposableStack();
        const { disposables, dispose } = createAsyncDisposables();
        stack.append(...disposables);
        await expect(dispose(stack)).resolves.toBe(true);
      });
    });

    describe(".create() should create stack with disposables", () => {
      it("sync", () => {
        const { disposables, dispose } = createDisposables();
        const stack = DisposableStack.create(...disposables);
        expect(dispose(stack)).toBe(true);
      });

      it("async", async () => {
        const { disposables, dispose } = createAsyncDisposables();
        const stack = AsyncDisposableStack.create(...disposables);
        await expect(dispose(stack)).resolves.toBe(true);
      });
    });

    describe(".transaction()", () => {
      describe("should run transaction", () => {
        it("sync", () => {
          const { disposables, dispose } = createDisposables();
          const stack = DisposableStack.transaction((stack) => stack.append(...disposables));
          expect(dispose(stack)).toBe(true);
        });

        it("async", async () => {
          const { disposables, dispose } = createAsyncDisposables();
          const stack = await AsyncDisposableStack.transaction((stack) => stack.append(...disposables));
          await expect(dispose(stack)).resolves.toBe(true);
        });
      });

      describe("should revert transaction", () => {
        it("sync", () => {
          const disposable = jest.fn();
          expect(() =>
            DisposableStack.transaction((stack) => {
              stack.append(disposable);
              throw new Error("test error");
            }),
          ).toThrow(new Error("test error"));
          expect(disposable).toHaveBeenCalledWith();
        });

        it("async", async () => {
          const disposable = jest.fn();
          await expect(
            AsyncDisposableStack.transaction((stack) => {
              stack.append(disposable);
              throw new Error("test error");
            }),
          ).rejects.toThrow(new Error("test error"));
          expect(disposable).toHaveBeenCalledWith();
        });
      });

      describe("should suppress dispose error", () => {
        it("sync", () => {
          const disposable = jest.fn(() => {
            throw new Error("dispose error");
          });
          expect(() =>
            DisposableStack.transaction((stack) => {
              stack.append(disposable);
              throw new Error("test error");
            }),
          ).toThrow(new SuppressedError(new Error("dispose error"), new Error("test error")));
          expect(disposable).toHaveBeenCalledWith();
        });

        it("async", async () => {
          const disposable = jest.fn().mockRejectedValue(new Error("dispose error") as never);
          await expect(
            AsyncDisposableStack.transaction((stack) => {
              stack.append(disposable);
              throw new Error("test error");
            }),
          ).rejects.toThrow(new SuppressedError(new Error("dispose error"), new Error("test error")));
          expect(disposable).toHaveBeenCalledWith();
        });
      });
    });

    describe("Async/DisposableStack.stamper", () => {
      describe("should store Async/DisposableStack and describe new dispose method", () => {
        it("sync", () => {
          const dispose = jest.fn();
          const value = { [Symbol.dispose]: dispose };
          const testData = createDisposables();
          DisposableStack.stamper.stamp(value).append(...testData.disposables);
          expect(value[Symbol.dispose]).not.toBe(dispose);

          value[Symbol.dispose]();
          expect(dispose).toHaveBeenCalled();
          testData.exposeDisposed();
          expect(DisposableStack.stamper.get(value).disposed).toBe(true);
        });

        it("async", async () => {
          const dispose = jest.fn();
          const asyncDispose = jest.fn(() => Promise.resolve());
          const value = { [Symbol.dispose]: dispose, [Symbol.asyncDispose]: asyncDispose };
          const testData = createAsyncDisposables();
          AsyncDisposableStack.stamper.stamp(value).append(...testData.disposables);
          expect(value[Symbol.dispose]).toBeUndefined();
          expect(value[Symbol.asyncDispose]).not.toBe(dispose);

          const promise = value[Symbol.asyncDispose]();
          testData.resolve();
          await promise;
          expect(asyncDispose).toHaveBeenCalled();
          expect(dispose).toHaveBeenCalled();
          testData.expectDisposed();
          expect(AsyncDisposableStack.stamper.get(value).disposed).toBe(true);
        });
      });
    });
  });

  describe("SuppressedError extensions", () => {
    const typed = <Error, Suppressed>(error: Error, suppressed: Suppressed): Extend<SuppressedError, { error: Error; suppressed: Suppressed }> =>
      new SuppressedError(error, suppressed);
    const _ = typed(
      new Error("top error"),
      typed(
        typed(new Error("middle error error"), new Error("middle error suppressed")),
        typed(new Error("bottom error"), new Error("bottom suppressed")),
      ),
    );

    it(".original() should return original error", () => {
      expect(_.original()).toBe(_.suppressed.suppressed.suppressed);
    });

    it(".flatten() should return array of icons", () => {
      const errors = _.flatten();
      expect(errors.length).toBe(4);
      expect(errors[0]).toBe(_.error);
      expect(errors[1]).toBe(_.suppressed.error);
      expect(errors[2]).toBe(_.suppressed.suppressed.error);
      expect(errors[3]).toBe(_.suppressed.suppressed.suppressed);
    });

    it("SuppressError.suppress() should throw passed error", () => {
      expect(() => SuppressedError.suppress(new Error("test error"), () => {})).toThrow(new Error("test error"));
    });

    it("SuppressError.suppress() should suppress passed error", () => {
      expect(() =>
        SuppressedError.suppress(new Error("test error"), () => {
          throw new Error("dispose error");
        }),
      ).toThrow(new SuppressedError(new Error("dispose error"), new Error("test error")));
    });
  });
});
