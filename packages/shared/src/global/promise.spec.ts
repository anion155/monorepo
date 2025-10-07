import "./promise";

import { describe, expect, it, jest } from "@jest/globals";

import { isPromisePending, TimeoutError } from "../promise";

jest.useFakeTimers();

describe("Promise extensions", () => {
  describe("Promise.never()", () => {
    it("should create never promise", async () => {
      const promise = Promise.never();
      await expect(isPromisePending(promise)).resolves.toBe(true);
    });
  });

  describe("Promise.delay()", () => {
    it("should create promise resolved on timeout", async () => {
      const promise = Promise.delay(10);
      await expect(isPromisePending(promise)).resolves.toBe(true);
      await jest.advanceTimersByTimeAsync(10);
      await expect(promise).resolves.toBeUndefined();
    });
  });

  describe("Promise.timeout()", () => {
    it("should create promise rejected on timeout", async () => {
      const promise = Promise.timeout(10);
      await expect(isPromisePending(promise)).resolves.toBe(true);
      await jest.advanceTimersByTimeAsync(10);
      await expect(promise).rejects.toThrow(new TimeoutError());
    });
  });

  describe("Promise.signal()", () => {
    it("should create signal that would be aborted on promise rejection", async () => {
      const signal = Promise.timeout(10).signal();
      expect(signal.aborted).toBe(false);
      await jest.advanceTimersByTimeAsync(10);
      expect(signal.aborted).toBe(true);
    });
  });
});
