import { describe, expect, it } from "@jest/globals";

import type { AssertPredicate } from "./asserts";
import { assert, AssertionError, assertPredicate } from "./asserts";

describe("asserts utils", () => {
  describe("class AssertionError", () => {
    it("should create error", () => {
      const error = new AssertionError("test value");
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe("AssertionError");
      expect(error.message).toBe("assertion failed: test value");
    });

    it("should fill message", () => {
      const error = new AssertionError("test value", "test message");
      expect(error.message).toBe("test message: test value");
    });
  });

  describe("assert()", () => {
    it("should assert truthy value", () => {
      expect(() => {
        assert(false, "test message");
      }).toThrow(new AssertionError(false, "test message"));
      expect(() => {
        assert(true);
      }).not.toThrow();
    });
  });

  describe("assertPredicate()", () => {
    const isString = (value: string | number): value is string => typeof value === "string";

    it("should assert predicate result", () => {
      let value: string | number = "test";
      assertPredicate(isString, value);
      value = 55;
      expect(() => {
        assertPredicate(isString, value);
      }).toThrow(new AssertionError(55));
    });

    describe("assertPredicate.create()", () => {
      const assertString: AssertPredicate<typeof isString> = assertPredicate.create(isString, "string assertion failed");

      it("should assert predicate result", () => {
        let value: string | number = "test";
        assertString(value);
        value = 55;
        expect(() => {
          assertString(value);
        }).toThrow(new AssertionError(55, "string assertion failed"));
      });

      it("should throw custom message", () => {
        expect(() => {
          assertString(55, "custom message");
        }).toThrow(new AssertionError(55, "custom message"));
      });
    });
  });
});
