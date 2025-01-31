import { describe, expect, it } from "@jest/globals";

import { is } from "./is";
import { isPromiseLike, isPromisePending } from "./promise";

describe("promise utils", () => {
  describe("isPromiseLike()", () => {
    it("should test if value is promise like", () => {
      expect(isPromiseLike(Promise.resolve())).toBe(true);
      expect(isPromiseLike({ then() {} })).toBe(true);
      expect(isPromiseLike({})).toBe(false);
      expect(is(Promise.resolve(), "promise")).toBe(true);
      expect(is({ then() {} }, "promise")).toBe(true);
      expect(is({}, "promise")).toBe(false);
    });
  });

  describe("isPromisePending()", () => {
    it("should return if promise is pending", async () => {
      await expect(isPromisePending(new Promise(() => {}))).resolves.toBe(true);
      await expect(isPromisePending(Promise.resolve(undefined))).resolves.toBe(false);
      await expect(isPromisePending(Promise.reject(new Error("test error")))).resolves.toBe(false);
    });
  });
});
