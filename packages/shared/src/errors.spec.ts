import { describe, expect, it } from "@jest/globals";

import { createErrorClass, DeveloperError, never, NotImplementedYet, TODO } from "./errors";

describe("errors utils", () => {
  it("should create test error", () => {
    class TestError extends createErrorClass("TestError", "test error") {}
    expect(new TestError()).toBeInstanceOf(Error);
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    expect(String(new TestError())).toBe("TestError: test error");
  });

  it("should create DeveloperError", () => {
    expect(new DeveloperError()).toBeInstanceOf(Error);
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    expect(String(new DeveloperError())).toBe("DeveloperError: should never happen in runtime");
  });

  it("never() should throw DeveloperError", () => {
    expect(never).toThrow(new DeveloperError());
  });

  it("should create NotImplementedYet", () => {
    expect(new NotImplementedYet()).toBeInstanceOf(Error);
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    expect(String(new NotImplementedYet())).toBe("NotImplementedYet: this functionality isn't implemented yet");
  });

  it("TODO() should throw NotImplementedYet", () => {
    expect(TODO).toThrow(new NotImplementedYet());
  });
});
