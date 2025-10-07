import { describe, expect, it } from "@jest/globals";

import { createErrorClass } from "./create-error-class";
import { DeveloperError } from "./errors";

describe("errors utils", () => {
  it("should create test error", () => {
    class TestError extends createErrorClass("TestError", "test error") {}
    expect(new TestError()).toBeInstanceOf(Error);
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    expect(String(new TestError())).toBe("TestError: test error");
  });

  it("should create developer test error", () => {
    class TestError extends createErrorClass("TestError", "test error", DeveloperError) {}
    expect(new TestError()).toBeInstanceOf(Error);
    expect(new TestError()).toBeInstanceOf(DeveloperError);
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    expect(String(new TestError())).toBe("TestError: test error");
  });
});
