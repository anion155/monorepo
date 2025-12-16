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

  it("should resolve", async () => {
    const deferred = Promise.withResolvers();
    deferred.resolve(1);
    await expect(deferred.promise).resolves.toBe(1);
  });

  it("should reject", async () => {
    const deferred = Promise.withResolvers();
    deferred.reject(new Error("test error"));
    await expect(deferred.promise).rejects.toThrow(new Error("test error"));
  });
});
