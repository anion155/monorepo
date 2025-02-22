import { describe, expect, it } from "@jest/globals";

import { AbortError } from "./abort";

describe("abort utils", () => {
  describe("AbortError", () => {
    it("should create instance of Error", () => {
      const error = new AbortError();
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("this operation was aborted");
    });
  });
});
