import "./string";

import { describe, expect, it } from "@jest/globals";

describe("String extensions", () => {
  describe("this.overflow()", () => {
    it("should return overflowed text", () => {
      expect("test".overflow(10)).toBe("test");
      expect("Incididunt irure.".overflow(10)).toBe("Incididun…");
    });
  });
});
