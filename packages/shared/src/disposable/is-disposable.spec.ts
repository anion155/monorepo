import { describe, expect, it } from "@jest/globals";

import { is } from "../is";
import { isDisposable } from "./is-disposable";

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
});
