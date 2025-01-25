import { describe, expect, it, jest } from "@jest/globals";

import "../global";

describe("Iterator helpers proposal", () => {
  function* inc() {
    let i = 0;
    while (true) {
      yield i;
      i += 1;
    }
  }

  describe("public constructor", () => {
    it("should be available from global", () => {
      expect(Iterator).toBeInstanceOf(Function);
    });

    it("should throw error on manual instantiation", () => {
      // @ts-expect-error(): type not constructible
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      expect(() => new Iterator()).toThrow("Abstract class Iterator not directly constructable");
      // @ts-expect-error(): type not constructible
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      expect(() => Iterator()).toThrow("Constructor Iterator requires 'new'");
    });

    it("should pass constructor for iterator subclass", () => {
      class TestIterator extends Iterator<number> {
        next(): IteratorResult<number> {
          return { value: 5 };
        }
      }
      expect(() => new TestIterator()).not.toThrow();
      expect(new TestIterator()).toBeInstanceOf(Iterator);
    });

    it("iterators should be instanceof Iterator", () => {
      expect([].values()).toBeInstanceOf(Iterator);
      expect(new Map().entries()).toBeInstanceOf(Iterator);
      expect(inc()).toBeInstanceOf(Iterator);
    });

    it("iterator should have Symbol.toStringTag and constructor", () => {
      expect(Iterator.prototype[Symbol.toStringTag]).toBe("Iterator");
      expect(Iterator.prototype.constructor).toBe(Iterator);
    });

    it("iterator should be iterable", () => {
      const incIter = inc();
      expect(incIter[Symbol.iterator]() === incIter).toBeTruthy();
    });

    describe('"from" wrapper iterator', () => {
      const iter = {
        "test-shadow-property": "test-value",
        next: jest.fn(() => ({ value: 5 })),
        return: jest.fn(() => ({ value: 6, done: true })),
        throw: jest.fn((error) => {
          throw error;
        }),
      } as Iterator<number, number, undefined> & { "test-shadow-property": string };
      const iterSimple = {
        next: jest.fn(() => ({ value: 5 })),
      } as Iterator<number>;

      it("from should return iterator instance", () => {
        const incIter = inc();
        expect(Iterator.from(incIter) === incIter).toBeTruthy();
        expect(Iterator.from({ [Symbol.iterator]: () => incIter }) === incIter).toBeTruthy();
      });

      it("from should wrap iterator object", () => {
        const wrapped = Iterator.from(iter);
        expect(wrapped).not.toBe(iter);
        expect(wrapped).toBeInstanceOf(Iterator);
        expect(wrapped).not.toStrictEqual(expect.objectContaining({ "test-shadow-property": "test-value" }));
      });

      it("should handle next", () => {
        const wrapped = Iterator.from(iter);
        expect(wrapped.next("test-next-arg")).toStrictEqual({ value: 5 });
        expect(iter.next).toHaveBeenCalledWith("test-next-arg");
      });

      it("should handle return", () => {
        const wrapped = Iterator.from(iter);

        expect(wrapped.return?.()).toStrictEqual({ value: 6, done: true });
        expect(iter.return).toHaveBeenCalledWith(undefined);

        expect(wrapped.next()).toStrictEqual({ value: undefined, done: true });
        expect(iter.next).not.toHaveBeenCalled();
      });

      it("should handle return without return in iterator", () => {
        const wrapped = Iterator.from(iterSimple);

        expect(wrapped.return?.()).toStrictEqual({ value: undefined, done: true });

        expect(wrapped.next()).toStrictEqual({ value: undefined, done: true });
        expect(iter.next).not.toHaveBeenCalled();
      });

      it("should handle throw", () => {
        const wrapped = Iterator.from(iter);
        const error = new Error("test-error");

        expect(() => wrapped.throw?.(error)).toThrow("test-error");
        expect(iter.throw).toHaveBeenCalledWith(error);

        expect(wrapped.next()).toStrictEqual({ value: undefined, done: true });
        expect(iter.next).not.toHaveBeenCalled();
      });

      it("should handle throw without throw in iterator", () => {
        const wrapped = Iterator.from(iterSimple);
        const error = new Error("test-error");

        expect(() => wrapped.throw?.(error)).toThrow("test-error");

        expect(wrapped.next()).toStrictEqual({ value: undefined, done: true });
        expect(iter.next).not.toHaveBeenCalled();
      });
    });
  });

  it("toArray should return resulted values as array", () => {
    expect([0, 1, 2].values().toArray()).toStrictEqual([0, 1, 2]);
  });

  it("take should take only first values", () => {
    expect(inc().take(2).toArray()).toStrictEqual([0, 1]);
  });

  it("take should return if iterator is done", () => {
    expect([0].values().take(2).toArray()).toStrictEqual([0]);
  });

  it("drop should drop first values", () => {
    expect(inc().drop(2).next()).toStrictEqual({ value: 2, done: false });
    expect(inc().take(1).drop(2).next()).toStrictEqual({ value: undefined, done: true });
  });

  const even = (v: number) => v % 2 === 0;
  const odd = (v: number) => v % 2 === 1;

  it("filter should filter values that does not comply with predicate", () => {
    expect(inc().take(5).filter(even).toArray()).toStrictEqual([0, 2, 4]);
  });

  it("every should check if every value is comply with predicate", () => {
    expect(inc().take(5).every(even)).toBe(false);
    expect(inc().take(5).filter(even).every(even)).toBe(true);
  });

  it("some should check if some value is comply with predicate", () => {
    expect(inc().take(5).some(even)).toBe(true);
    expect(inc().take(5).filter(even).some(odd)).toBe(false);
  });

  it("find should find first item that comply with predicate", () => {
    expect(inc().find(even)).toBe(0);
    expect(inc().drop(2).find(even)).toBe(2);
    expect(inc().take(1).find(odd)).toBeUndefined();
  });

  it("map should project values", () => {
    expect(inc().take(2).map(String).toArray()).toStrictEqual(["0", "1"]);
  });

  it("forEach should call callback on every value", () => {
    const cb = jest.fn();
    inc().take(5).map(String).forEach(cb);
    expect(cb.mock.calls).toStrictEqual([
      ["0", 0],
      ["1", 1],
      ["2", 2],
      ["3", 3],
      ["4", 4],
    ]);
  });

  it("flatMap should map returned iterators instead", () => {
    expect(
      ["Eiusmod consectetur", "nisi sint dolor"]
        .values()
        .flatMap((v) => v.split(" "))
        .toArray(),
    ).toStrictEqual(["Eiusmod", "consectetur", "nisi", "sint", "dolor"]);
  });

  it("reduce should map returned resulted value", () => {
    expect(["Eiusmod", "consectetur", "nisi", "sint", "dolor"].values().reduce((acc, v) => `${acc} ${v}`)).toBe(
      "Eiusmod consectetur nisi sint dolor",
    );
  });
});
