import { AsyncIteratorPrototype } from "@anion155/proposal-async-iterator-helpers/async-iterator-prototype";
import { describe, expect, it, jest } from "@jest/globals";

import "../index";

describe("Explicit resource management proposal", () => {
  describe("AsyncIterator.prototype[Symbol.asyncDispose]", () => {
    async function* inc() {
      let i = 0;
      while (true) {
        yield Promise.resolve(i);
        i += 1;
      }
    }

    it("AsyncIterator.prototype should implement async dispose protocol", () => {
      expect(Symbol.asyncDispose in AsyncIteratorPrototype && AsyncIteratorPrototype[Symbol.asyncDispose]).toStrictEqual(expect.any(Function));
    });

    it("dispose should run return method", async () => {
      const iter = inc();
      const returnSpy = jest.spyOn(iter, "return");
      await expect(iter.next()).resolves.toStrictEqual({ value: 0, done: false });
      await iter[Symbol.asyncDispose]();
      await expect(iter.next()).resolves.toStrictEqual({ value: undefined, done: true });
      expect(returnSpy).toHaveBeenCalledWith();
    });
  });
});
