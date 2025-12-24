import "./math";

import { describe, expect, it } from "@jest/globals";

describe("Math extensions", () => {
  describe("Math.clamp()", () => {
    it("should return clamped value", () => {
      expect(Math.clamp(1, 2, 3)).toBe(2);
      expect(Math.clamp(1, 0, 3)).toBe(1);
      expect(Math.clamp(1, 4, 3)).toBe(3);
    });
  });
});
