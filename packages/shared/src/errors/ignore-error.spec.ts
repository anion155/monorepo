import { describe, expect, it } from "@jest/globals";

import { DeveloperError } from "./errors";
import { ignoreError } from "./ignore-error";

describe("ignoreError()", () => {
  it("should ignore error", () => {
    const main = ignoreError(
      DeveloperError,
      -1,
    )((argv: unknown) => {
      if (!Array.isArray(argv)) throw new DeveloperError("only array allowed");
      return 0;
    });
    expect(main([])).toBe(0);
    expect(main(5)).toBe(-1);
  });

  it("should rethrow any other errors", () => {
    const main = ignoreError(
      DeveloperError,
      -1,
    )(() => {
      throw new Error("test throw");
    });
    expect(() => main()).toStrictThrow(new Error("test throw"));
  });

  it("should handle rejected promise", async () => {
    const main = ignoreError(
      DeveloperError,
      -1,
      // eslint-disable-next-line @typescript-eslint/require-await
    )(async (argv: unknown) => {
      if (!Array.isArray(argv)) throw new DeveloperError("only array allowed");
      return 0;
    });
    await expect(main([])).resolves.toBe(0);
    await expect(main(5)).resolves.toBe(-1);
  });

  it("should rethrow any other errors from promise", async () => {
    const main = ignoreError(DeveloperError, -1)(() => Promise.reject(new Error("test throw")));
    await expect(main()).rejects.toStrictThrow(new Error("test throw"));
  });
});
