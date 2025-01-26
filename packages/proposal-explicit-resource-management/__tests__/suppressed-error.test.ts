import { describe, expect, it } from "@jest/globals";
import { SuppressedError } from "../suppressed-error";

describe("Explicit resource management proposal", () => {
  describe("SuppressedError", () => {
    it("should be constructible", () => {
      expect(new SuppressedError("a", "b", "c")).toBeInstanceOf(SuppressedError);
      expect(SuppressedError("a", "b", "c")).toBeInstanceOf(SuppressedError);
    });

    it("should have name property", () => {
      expect(new SuppressedError("a", "b", "c")).toHaveProperty("name", "SuppressedError");
    });

    it("should be able to detect by tests", () => {
      expect(new SuppressedError(new Error("Test 1"), new Error("Test 2"), "c")).toStrictEqual(
        new SuppressedError(new Error("Test 1"), new Error("Test 2"), "c"),
      );
      expect(new SuppressedError(new Error("Test 1"), new Error("Test 2"), "c")).not.toStrictEqual(
        new SuppressedError(new Error("Test 1"), new Error("Test 2"), "b"),
      );
      expect(new SuppressedError(new Error("Test 1"), new Error("Test 2"), "c")).not.toStrictEqual(
        new SuppressedError(new Error("Test 1"), new Error("Test 3"), "c"),
      );
      expect(new SuppressedError(new Error("Test 1"), new Error("Test 2"), "c")).not.toStrictEqual(
        new SuppressedError(new Error("Test 2"), new Error("Test 2"), "c"),
      );
    });
  });
});
