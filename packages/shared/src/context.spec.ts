import { describe, expect, it } from "@jest/globals";

import { createContextStack } from "./context";

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
