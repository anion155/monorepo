import { describe, expect, it } from "@jest/globals";

import { DeveloperError, NotImplementedYet, TODO, UNREACHABLE } from "./errors";

describe("errors utils", () => {
  it("should create DeveloperError", () => {
    expect(new DeveloperError()).toBeInstanceOf(Error);
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    expect(String(new DeveloperError())).toBe("DeveloperError: should never happen in runtime");
  });

  it("UNREACHABLE() should throw DeveloperError", () => {
    expect(UNREACHABLE).toThrow(new DeveloperError());
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
