import { describe, expect, it } from "@jest/globals";

import { createErrorClass } from "./create-error-class";

describe("errors utils", () => {
  it("should create test error", () => {
    class TestError extends createErrorClass("TestError", "test error") {}
    expect(new TestError()).toBeInstanceOf(Error);
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    expect(String(new TestError())).toBe("TestError: test error");
  });
});
