import "./global";

import { describe, expect, it } from "@jest/globals";

describe("Promise.withResolvers", () => {
  it("should return api", () => {
    const deferred = Promise.withResolvers();
    expect(deferred).toStrictEqual({
      promise: expect.any(Promise),
      resolve: expect.any(Function),
      reject: expect.any(Function),
    });
  });
});
