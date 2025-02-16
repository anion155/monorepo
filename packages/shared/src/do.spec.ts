import { describe, expect, it, jest } from "@jest/globals";

import { doApply, doRun, doThrow, doWith } from "./do";

describe("do utils", () => {
  describe("doThrow()", () => {
    it("should throw error", () => {
      expect(() => doThrow(new Error("test error"))).toThrow(new Error("test error"));
    });

    it("should throw error from message", () => {
      expect(() => doThrow("test error")).toThrow(new Error("test error"));
    });
  });

  describe("doThrow.async ()", () => {
    it("should return rejected Promise", async () => {
      await expect(doThrow.async(new Error("test error"))).rejects.toThrow(new Error("test error"));
    });

    it("should throw error from message", async () => {
      await expect(doThrow.async("test error")).rejects.toThrow(new Error("test error"));
    });
  });

  describe("doRun()", () => {
    it("should return result", () => {
      expect(doRun(() => "result")).toBe("result");
    });

    it("should return catch result", () => {
      expect(
        doRun(
          () => doThrow(new Error("test error")),
          () => "catch result",
        ),
      ).toBe("catch result");
    });
  });

  describe("doRun.async()", () => {
    it("should return result", async () => {
      await expect(doRun.async(() => Promise.resolve("result"))).resolves.toBe("result");
    });

    it("should return catch result", async () => {
      await expect(
        doRun.async(
          () => doThrow.async("test error"),
          () => "catch result",
        ),
      ).resolves.toBe("catch result");
    });

    it("should return sync value from catch", async () => {
      await expect(
        doRun.async(
          () => doThrow.async("test error"),
          () => "catch result",
        ),
      ).resolves.toBe("catch result");
    });
  });

  describe("doApply()", () => {
    it("should apply function to value", () => {
      const value = { type: "test-value" };
      const apply = jest.fn(() => "return value");
      expect(doApply(value, apply)).toBeUndefined();
      expect(apply).toHaveBeenCalledWith(value);
    });
  });

  describe("doApplyAsync()", () => {
    it("should apply function to value", async () => {
      const value = { type: "test-value" };
      const apply = jest.fn(() => Promise.resolve("return value"));
      await expect(doApply.async(value, apply)).resolves.toBeUndefined();
      expect(apply).toHaveBeenCalledWith(value);
    });
  });

  describe("doWith()", () => {
    it("should return fn result and dispose of arguments", () => {
      const stack = new DisposableStack();
      const fn = jest.fn((..._args: unknown[]) => "return value");
      expect(doWith(stack, fn)).toBe("return value");
      expect(fn).toHaveBeenCalledWith(stack);
      expect(stack.disposed).toBe(true);
    });

    it("should handle fn error", () => {
      const stack = new DisposableStack();
      stack.append(() => doThrow("dispose error"));
      const fn = jest.fn((..._args: unknown[]) => doThrow("fn error"));
      expect(() => doWith(stack, fn)).toThrow(new SuppressedError(new Error("dispose error"), new Error("fn error")));
    });
  });

  describe("doWith.async()", () => {
    it("should return fn result and dispose of arguments", async () => {
      const stack = new AsyncDisposableStack();
      const fn = jest.fn((..._args: unknown[]) => Promise.resolve("return value"));
      await expect(doWith.async(stack, fn)).resolves.toBe("return value");
      expect(fn).toHaveBeenCalledWith(stack);
      expect(stack.disposed).toBe(true);
    });

    it("should handle fn error", async () => {
      const stack = new AsyncDisposableStack();
      stack.append(() => doThrow("dispose error"));
      const fn = jest.fn((..._args: unknown[]) => doThrow.async("fn error"));
      await expect(doWith.async(stack, fn)).rejects.toThrow(new SuppressedError(new Error("dispose error"), new Error("fn error")));
    });
  });
});
