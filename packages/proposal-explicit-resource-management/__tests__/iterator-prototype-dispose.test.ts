import { IteratorPrototype } from "@anion155/proposal-iterator-helpers/iterator-prototype";
import { describe, expect, it, jest } from "@jest/globals";

import "../iterator-prototype-dispose";

describe("Explicit resource management proposal", () => {
  describe("Iterator.prototype[Symbol.dispose]", () => {
    function* inc() {
      let i = 0;
      while (true) {
        yield i;
        i += 1;
      }
    }

    it("Iterator.prototype should implement dispose protocol", () => {
      expect(Symbol.dispose in IteratorPrototype && IteratorPrototype[Symbol.dispose]).toStrictEqual(expect.any(Function));
    });

    it("dispose should run return method", () => {
      const iter = inc();
      const returnSpy = jest.spyOn(iter, "return");
      expect(iter.next()).toStrictEqual({ value: 0, done: false });
      iter[Symbol.dispose]();
      expect(iter.next()).toStrictEqual({ value: undefined, done: true });
      expect(returnSpy).toHaveBeenCalledWith();
    });
  });
});
