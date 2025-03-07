import { describe, expect, it, jest } from "@jest/globals";

import { createContextStack, InferContextStack } from "./context";

describe("context utils", () => {
  describe("createContextStack()", () => {
    it("should return expected api", () => {
      const context = createContextStack({ type: "none" });
      expect(context).toStrictEqual(
        expect.objectContaining({
          current: expect.any(Function),
          iterator: expect.any(Function),
          // [Symbol.iterator]: expect.any(Function),
          push: expect.any(Function),
          pop: expect.any(Function),
          setup: expect.any(Function),
        }),
      );
      expect(context[Symbol.iterator]).toBe(context.iterator);
    });

    it("should store and update value", () => {
      const context = createContextStack({ type: "none" });
      expect(context.current()).toStrictEqual({ type: "none" });

      context.push({ type: "store" });
      expect(context.current()).toStrictEqual({ type: "store" });

      context.push({ type: "remove" });
      expect(context.current()).toStrictEqual({ type: "remove" });

      expect(context.pop()).toStrictEqual({ type: "remove" });
      expect(context.current()).toStrictEqual({ type: "store" });

      context.push({ type: "remove" });
      expect(context.pop(2)).toStrictEqual([]);
      expect(context.pop(1)).toStrictEqual([{ type: "remove" }]);

      context.push({ type: "remove" });
      expect(context.pop(0)).toStrictEqual([{ type: "remove" }, { type: "store" }]);
      expect(context.current()).toStrictEqual({ type: "none" });

      context.push({ type: "remove" });
      const clean = context.push({ type: "store" });
      expect(context.current()).toStrictEqual({ type: "store" });
      context.push({ type: "remove" });
      clean();
      expect(context.current()).toStrictEqual({ type: "remove" });
    });

    it("should cleanup on pop", () => {
      const context = createContextStack({ type: "none" });
      const cleanup = jest.fn();
      const pushWithCleanup = (next: InferContextStack<typeof context>) => context.push(next, () => cleanup(next));

      pushWithCleanup({ type: "store" });
      pushWithCleanup({ type: "remove" });
      context.pop();
      expect(cleanup).toHaveBeenCalledTimes(1);
      expect(cleanup).toHaveBeenCalledWith({ type: "remove" });
      cleanup.mockClear();

      pushWithCleanup({ type: "remove" });
      context.pop(2);
      expect(cleanup).toHaveBeenCalledTimes(0);
      context.pop(1);
      expect(cleanup).toHaveBeenCalledTimes(1);
      expect(cleanup).toHaveBeenCalledWith({ type: "remove" });
      cleanup.mockClear();
      pushWithCleanup({ type: "remove" });
      context.pop(0);
      expect(cleanup).toHaveBeenCalledTimes(2);
      expect(cleanup).toHaveBeenNthCalledWith(1, { type: "remove" });
      expect(cleanup).toHaveBeenNthCalledWith(2, { type: "store" });
      cleanup.mockClear();

      const pop = pushWithCleanup({ type: "store" });
      pushWithCleanup({ type: "remove" });
      pop();
      expect(cleanup).toHaveBeenCalledTimes(2);
      expect(cleanup).toHaveBeenNthCalledWith(1, { type: "remove" });
      expect(cleanup).toHaveBeenNthCalledWith(2, { type: "store" });
      cleanup.mockClear();
    });

    it("should iterate over values in context in reverse order", () => {
      const context = createContextStack({ type: "none" });
      context.push({ type: "store" });
      context.push({ type: "remove" });
      expect(context.iterator().toArray()).toStrictEqual([{ type: "remove" }, { type: "store" }, { type: "none" }]);
    });

    it(".setup() should push value, return it as resource that pop value on dispose", () => {
      const context = createContextStack({ type: "none" });
      {
        using store = context.setup({ type: "store" });
        context.push({ type: "store" });
        expect(store.type).toBe("store");
        expect(typeof store[Symbol.dispose]).toBe("function");
      }
      context.push({ type: "none" });
    });
  });
});
