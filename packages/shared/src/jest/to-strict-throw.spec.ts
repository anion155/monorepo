import "./to-strict-throw";

import { describe, expect, it } from "@jest/globals";

import { doThrow } from "../do";
import { createErrorClass, DeveloperError } from "../errors";
import { compareErrorsDeep } from "./to-strict-throw";

declare module "expect" {
  interface AsymmetricMatchers {
    stripColor(expected: string): void;
  }
}
expect.extend({
  stripColor(actualUnknown: unknown, expected: string) {
    // eslint-disable-next-line no-control-regex
    const actual = (actualUnknown instanceof Error ? actualUnknown.message : String(actualUnknown)).replace(/\x1B[[(?);]{0,2}(;?\d)*./g, "");
    const pass = actual === expected;
    return { pass, message: () => this.utils.matcherHint("stripColor", actual, expected, this) };
  },
});

describe(".toStringThrow()", () => {
  class AnotherDeveloperError extends createErrorClass("DeveloperError") {}

  it("should detect thrown errors with precision", () => {
    expect(() => doThrow(new DeveloperError("test"))).toStrictThrow(new DeveloperError("test"));
    expect(() => doThrow(new DeveloperError("test"))).not.toStrictThrow(new Error("test"));
  });

  it("should validate arguments", async () => {
    expect(() => {
      expect(() => doThrow(new DeveloperError("test"))).toStrictThrow("test" as never);
    }).toStrictThrow(new TypeError("should be called with Error instance"));
    expect(() => {
      expect(new DeveloperError("test")).toStrictThrow(new DeveloperError("test"));
    }).toStrictThrow(new TypeError("should be called with function"));
    expect(() => {
      expect(() => {}).toStrictThrow(new DeveloperError("test"));
    }).toStrictThrow(new TypeError("function did not throw"));
    // eslint-disable-next-line jest/valid-expect
    await expect(expect(Promise.resolve(1)).resolves.toStrictThrow(new DeveloperError("test"))).rejects.toStrictThrow(
      new TypeError("should be called with rejected promise only"),
    );
    // eslint-disable-next-line jest/valid-expect, @typescript-eslint/prefer-promise-reject-errors
    await expect(expect(Promise.reject(1)).rejects.toStrictThrow(new DeveloperError("test"))).rejects.toStrictThrow(
      new TypeError("should be called with Error instance"),
    );
  });

  it("should form error message", () => {
    expect(() => {
      expect(() => doThrow(new DeveloperError("test"))).toStrictThrow(new Error("test"));
    }).toThrow(
      expect.stripColor(`expect(received).toBe(expected) // deep error compare

Difference:

- Expected
+ Received

- [Error: test]
+ [DeveloperError: test]`),
    );
    expect(() => {
      expect(() => doThrow(new DeveloperError("test"))).toStrictThrow(new AnotherDeveloperError("test"));
    }).toThrow(
      expect.stripColor(`expect(received).toBe(expected) // deep error compare

Expected: [DeveloperError: test]
Received: [DeveloperError: test]`),
    );
    expect(() => {
      expect(() => doThrow(new DeveloperError("test"))).not.toStrictThrow(new DeveloperError("test"));
    }).toThrow(
      expect.stripColor(`expect(received).not.toStrictThrow(expected) // deep error compare

Expected: not [DeveloperError: test]
Received: [DeveloperError: test]`),
    );
  });

  it("compareErrorsDeep()", () => {
    expect(compareErrorsDeep("a", "a")).toBe(true);
    expect(compareErrorsDeep(new Error("a"), "a")).toBe(false);
    expect(compareErrorsDeep(new DeveloperError("a"), new AnotherDeveloperError("a"))).toBe(false);
    expect(compareErrorsDeep(new Error("a"), new Error("b"))).toBe(false);
    expect(compareErrorsDeep(Object.assign(new Error("a"), { test: 1 }), new Error("a"))).toBe(false);
    expect(compareErrorsDeep(Object.assign(new Error("a"), { left: 1 }), Object.assign(new Error("a"), { right: 1 }))).toBe(false);
    expect(compareErrorsDeep(Object.assign(new Error("a"), { test: 1 }), Object.assign(new Error("a"), { test: 2 }))).toBe(false);
    expect(compareErrorsDeep(Object.assign(new Error("a"), { test: 1 }), Object.assign(new Error("a"), { test: 1 }))).toBe(true);
  });
});
