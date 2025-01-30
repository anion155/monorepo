import { describe, expect, it } from "@jest/globals";

import { isPending } from "./promise";

describe("promise utils", () => {
  describe("isPending()", () => {
    it("should return if promise is pending", async () => {
      await expect(isPending(new Promise(() => {}))).resolves.toBe(true);
      await expect(isPending(Promise.resolve(undefined))).resolves.toBe(false);
      await expect(isPending(Promise.reject(new Error("test error")))).resolves.toBe(false);
    });
  });
});
