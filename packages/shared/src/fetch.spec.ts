import { describe, expect, it, jest } from "@jest/globals";

import { fetch, handleAbortedFetch } from "./fetch";
import { defineProperty, getOwnProperty } from "./object";

describe("fetch utils", () => {
  describe("handleAbortedFetch()", () => {
    it("should rethrow original error without signal", () => {
      expect(() => handleAbortedFetch()(new Error("test error"))).toThrow(new Error("test error"));
    });

    it("should rethrow error if it's same as signal's reason", () => {
      const controller = new AbortController();
      const reason = new Error("test error");
      controller.abort(reason);
      expect(() => handleAbortedFetch(controller.signal)(reason)).toThrow(reason);
    });

    it("should rethrow error", () => {
      const controller = new AbortController();
      expect(() => handleAbortedFetch(controller.signal)(new Error("test error"))).toThrow(new Error("test error"));
    });

    it("should throw reason from signal", () => {
      const controller = new AbortController();
      controller.abort(new Error("test reason error"));
      expect(() => handleAbortedFetch(controller.signal)(new DOMException("test passed error", "AbortError"))).toThrow(
        new Error("test reason error"),
      );
    });
  });

  describe("fetch()", () => {
    it("should have api", () => {
      expect(fetch).not.toBe(globalThis.fetch);
      expect(fetch.original).toBe(globalThis.fetch);
    });

    it("should reject", async () => {
      const controller = new AbortController();
      controller.abort(new Error("test error"));
      const original = jest.spyOn(fetch, "original");
      await expect(fetch("test://example", { signal: controller.signal })).rejects.toThrow(new Error("test error"));
      expect(original).toHaveBeenCalledWith("test://example", { signal: controller.signal });
    });
  });

  describe("fetch.polyfill()", () => {
    it("should replace original fetch", () => {
      const original = getOwnProperty(globalThis, "fetch")!;
      expect(globalThis.fetch).not.toBe(fetch);
      fetch.polyfill();
      expect(globalThis.fetch).toBe(fetch);
      defineProperty(globalThis, "fetch", original);
    });
  });
});
