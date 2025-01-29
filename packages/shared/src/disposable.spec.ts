import { describe, expect, it, jest } from "@jest/globals";

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
});
