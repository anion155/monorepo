import { describe, expect, it, jest } from "@jest/globals";

import { appendDispose, disposableFrom, isDisposable } from "./disposable";
import { is } from "./is";
import { isPrototypeOf } from "./object";

describe("disposable utils", () => {
  describe("isDisposable()", () => {
    it("should test if value is disposable", () => {
      expect(isDisposable({ [Symbol.asyncDispose]: () => {} })).toBe(false);
      expect(isDisposable({ [Symbol.dispose]: () => {} })).toBe(true);
      expect(isDisposable({})).toBe(false);
      expect(is({ [Symbol.asyncDispose]: () => {} }, "disposable")).toBe(false);
      expect(is({ [Symbol.dispose]: () => {} }, "disposable")).toBe(true);
      expect(is({}, "disposable")).toBe(false);
    });
  });

  describe("isDisposable.async()", () => {
    it("should test if value is async disposable", () => {
      expect(isDisposable.async({ [Symbol.asyncDispose]: () => {} })).toBe(true);
      expect(isDisposable.async({ [Symbol.dispose]: () => {} })).toBe(false);
      expect(isDisposable.async({})).toBe(false);
      expect(is({ [Symbol.asyncDispose]: () => {} }, "asyncDisposable")).toBe(true);
      expect(is({ [Symbol.dispose]: () => {} }, "asyncDisposable")).toBe(false);
      expect(is({}, "asyncDisposable")).toBe(false);
    });
  });

  describe("disposableFrom()", () => {
    it("should create disposable from async disposable", async () => {
      const disposable = { [Symbol.asyncDispose]: () => Promise.resolve(), [Symbol.dispose]: () => {} };
      expect(disposableFrom(disposable)).toBe(disposable);

      const asyncDisposable = { [Symbol.asyncDispose]: jest.fn(() => Promise.resolve(undefined)) };
      const combined = disposableFrom(asyncDisposable);
      expect(combined).not.toBe(asyncDisposable);
      expect(isPrototypeOf(asyncDisposable, combined)).toBe(true);
      await expect(combined[Symbol.dispose]()).resolves.toBe(undefined);
      expect(asyncDisposable[Symbol.asyncDispose]).toHaveBeenCalledWith();
    });
  });

  describe("appendDispose()", () => {
    it("should add disposables to stack", () => {
      const stack = new DisposableStack();
      const disposable = jest.fn();
      appendDispose(stack, disposable);
      stack.dispose();
      expect(disposable).toHaveBeenCalledWith();
    });

    it("should add dispose method", () => {
      const dispose = jest.fn();
      const value = { [Symbol.dispose]: dispose };
      const disposables = [jest.fn(), jest.fn()] as const;
      appendDispose(value, disposables[0]);
      appendDispose(value, disposables[1]);
      value[Symbol.dispose]();
      expect(disposables[0]).toHaveBeenCalledWith();
      expect(disposables[1]).toHaveBeenCalledWith();
    });
  });

  describe("appendDispose.async()", () => {
    it("should add disposables to stack", async () => {
      const stack = new AsyncDisposableStack();
      const disposable = jest.fn();
      appendDispose.async(stack, disposable);
      await stack.disposeAsync();
      expect(disposable).toHaveBeenCalledWith();
    });

    it("should add disposeAsync method to async disposable", async () => {
      const dispose = jest.fn();
      const value = { [Symbol.asyncDispose]: dispose };
      const disposables = [jest.fn(), new AsyncDisposableStack()] as const;
      appendDispose.async(value, disposables[0]);
      appendDispose.async(value, disposables[1]);
      await value[Symbol.asyncDispose]();
      expect(disposables[0]).toHaveBeenCalledWith();
      expect(disposables[1].disposed).toBe(true);
    });

    it("should add disposeAsync method to disposable, should delete dispose method", async () => {
      const dispose = jest.fn();
      const disposeAsync = jest.fn(() => Promise.resolve());
      const value = { [Symbol.dispose]: dispose, [Symbol.asyncDispose]: disposeAsync };
      const disposables = [jest.fn(), new AsyncDisposableStack()] as const;
      appendDispose.async(value, disposables[0]);
      expect(value[Symbol.dispose]).toBeUndefined();
      appendDispose.async(value, disposables[1]);
      await value[Symbol.asyncDispose]();
      expect(disposables[0]).toHaveBeenCalledWith();
      expect(disposables[1].disposed).toBe(true);
    });
  });

  it("appendDispose() after appendDispose.async() should append to AsyncDisposableStack", async () => {
    const dispose = jest.fn();
    const disposeAsync = jest.fn(() => Promise.resolve());
    const value = { [Symbol.dispose]: dispose, [Symbol.asyncDispose]: disposeAsync };
    const disposables = [new AsyncDisposableStack(), jest.fn()] as const;
    appendDispose.async(value, disposables[0]);
    appendDispose(value, disposables[1]);
    await value[Symbol.asyncDispose]();
    expect(disposables[0].disposed).toBe(true);
    expect(disposables[1]).toHaveBeenCalledWith();
  });
});
