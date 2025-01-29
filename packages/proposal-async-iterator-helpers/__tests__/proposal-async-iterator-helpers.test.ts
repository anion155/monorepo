import "../global";

import { describe, expect, it, jest } from "@jest/globals";

describe("AsyncIterator helpers proposal", () => {
  async function* inc(max: number = Number.MAX_SAFE_INTEGER) {
    let i = 0;
    while (true) {
      if (i >= max) return Promise.resolve(i);
      yield Promise.resolve(i);
      i += 1;
    }
  }

  describe("public constructor", () => {
    it("should be available from global", () => {
      expect(AsyncIterator).toStrictEqual(expect.any(Function));
    });

    it("should throw error on manual instantiation", () => {
      expect(() => new AsyncIterator()).toThrow("Abstract class AsyncIterator not directly constructable");
      expect(() => AsyncIterator()).toThrow("Constructor AsyncIterator requires 'new'");
    });

    it("should pass constructor for async iterator subclass", () => {
      class TestIterator extends AsyncIterator<number> {
        next(): Promise<IteratorResult<number>> {
          return Promise.resolve({ value: 5 });
        }
      }
      expect(() => new TestIterator()).not.toThrow();
      expect(new TestIterator()).toBeInstanceOf(AsyncIterator);
    });

    it("async iterators should be instanceof AsyncIterator", () => {
      // Not supported in node
      // expect(new ReadableStream()[Symbol.asyncIterator]()).toBeInstanceOf(Iterator);
      expect(inc()).toBeInstanceOf(AsyncIterator);
    });

    it("async iterator should have Symbol.toStringTag and constructor", () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(AsyncIterator.prototype[Symbol.toStringTag]).toBe("AsyncIterator");
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(AsyncIterator.prototype.constructor).toBe(AsyncIterator);
    });

    it("async iterator should be asynchronously iterable", () => {
      const incIter = inc();
      expect(incIter[Symbol.asyncIterator]() === incIter).toBeTruthy();
    });

    describe('"from" wrapper iterator', () => {
      const iter = {
        "test-shadow-property": "test-value",
        next: jest.fn(() => Promise.resolve({ value: 5 })),
        return: jest.fn(() => Promise.resolve({ value: 6, done: true })),
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        throw: jest.fn((error) => Promise.reject(error)),
      } as AsyncIterator<number, number, string> & { "test-shadow-property": string };
      const iterSimple = {
        next: jest.fn(() => Promise.resolve({ value: 5 })),
      } as AsyncIterator<number>;

      it("from should return async iterator instance", () => {
        const incIter = inc();
        expect(AsyncIterator.from(incIter) === incIter).toBeTruthy();
        expect(AsyncIterator.from({ [Symbol.asyncIterator]: () => incIter }) === incIter).toBeTruthy();
      });

      it("from should async iterator version of iterator", () => {
        const wrapped = AsyncIterator.from([0, 1, 2][Symbol.iterator]());
        expect(wrapped).toBeInstanceOf(AsyncIterator);
      });

      it("from should wrap async iterator object", () => {
        const wrapped = AsyncIterator.from(iter);
        expect(wrapped).not.toBe(iter);
        expect(wrapped).toBeInstanceOf(AsyncIterator);
        expect(wrapped).not.toStrictEqual(expect.objectContaining({ "test-shadow-property": "test-value" }));
      });

      it("should handle next", async () => {
        const wrapped = AsyncIterator.from(iter);
        await expect(wrapped.next("test-next-arg")).resolves.toStrictEqual({ value: 5 });
        expect(iter.next).toHaveBeenCalledWith("test-next-arg");
      });

      it("should handle return", async () => {
        const wrapped = AsyncIterator.from(iter);

        await expect(wrapped.return?.(2)).resolves.toStrictEqual({ value: 6, done: true });
        expect(iter.return).toHaveBeenCalledWith(2);

        await expect(wrapped.next()).resolves.toStrictEqual({ value: undefined, done: true });
        expect(iter.next).not.toHaveBeenCalled();
      });

      it("should handle return without return in async iterator", async () => {
        const wrapped = AsyncIterator.from(iterSimple);

        await expect(wrapped.return?.(2)).resolves.toStrictEqual({ value: 2, done: true });

        await expect(wrapped.next()).resolves.toStrictEqual({ value: undefined, done: true });
        expect(iter.next).not.toHaveBeenCalled();
      });

      it("should handle throw", async () => {
        const wrapped = AsyncIterator.from(iter);
        const error = new Error("test-error");

        await expect(() => wrapped.throw?.(error)).rejects.toThrow("test-error");
        expect(iter.throw).toHaveBeenCalledWith(error);

        await expect(wrapped.next()).resolves.toStrictEqual({ value: undefined, done: true });
        expect(iter.next).not.toHaveBeenCalled();
      });

      it("should handle throw without throw in async iterator", async () => {
        const wrapped = AsyncIterator.from(iterSimple);
        const error = new Error("test-error");

        await expect(() => wrapped.throw?.(error)).rejects.toThrow("test-error");

        await expect(wrapped.next()).resolves.toStrictEqual({ value: undefined, done: true });
        expect(iter.next).not.toHaveBeenCalled();
      });
    });
  });

  it("toArray should return resulted values as array", async () => {
    await expect(inc(2).toArray()).resolves.toStrictEqual([0, 1]);
  });

  it("take should take only first values", async () => {
    await expect(inc().take(2).toArray()).resolves.toStrictEqual([0, 1]);
  });

  it("take should return if iterator is done", async () => {
    await expect(inc(1).take(2).toArray()).resolves.toStrictEqual([0]);
  });

  it("drop should drop first values", async () => {
    await expect(inc().drop(2).next()).resolves.toStrictEqual({ value: 2, done: false });
    await expect(inc().take(1).drop(2).next()).resolves.toStrictEqual({ value: undefined, done: true });
  });

  const even = (v: number) => v % 2 === 0;
  const odd = (v: number) => v % 2 === 1;

  it("filter should filter values that does not comply with predicate", async () => {
    await expect(inc().take(5).filter(even).toArray()).resolves.toStrictEqual([0, 2, 4]);
  });

  it("every should check if every value is comply with predicate", async () => {
    await expect(inc().take(5).every(even)).resolves.toBe(false);
    await expect(inc().take(5).filter(even).every(even)).resolves.toBe(true);
  });

  it("some should check if some value is comply with predicate", async () => {
    await expect(inc().take(5).some(even)).resolves.toBe(true);
    await expect(inc().take(5).filter(even).some(odd)).resolves.toBe(false);
  });

  it("find should find first item that comply with predicate", async () => {
    await expect(inc().find(even)).resolves.toBe(0);
    await expect(inc().drop(2).find(even)).resolves.toBe(2);
    await expect(inc().take(1).find(odd)).resolves.toBeUndefined();
  });

  it("map should project values", async () => {
    await expect(inc().take(2).map(String).toArray()).resolves.toStrictEqual(["0", "1"]);
  });

  it("forEach should call callback on every value", async () => {
    const cb = jest.fn(() => {});
    await inc().take(5).map(String).forEach(cb);
    expect(cb.mock.calls).toStrictEqual([
      ["0", 0],
      ["1", 1],
      ["2", 2],
      ["3", 3],
      ["4", 4],
    ]);
  });

  it("flatMap should map returned iterators instead", async () => {
    await expect(
      ["Eiusmod consectetur", "nisi sint dolor"]
        .values()
        .toAsync()
        .flatMap((v) => v.split(" "))
        .toArray(),
    ).resolves.toStrictEqual(["Eiusmod", "consectetur", "nisi", "sint", "dolor"]);
  });

  it("reduce should map returned resulted value", async () => {
    await expect(
      ["Eiusmod", "consectetur", "nisi", "sint", "dolor"]
        .values()
        .toAsync()
        .reduce((acc, v) => `${acc} ${v}`),
    ).resolves.toBe("Eiusmod consectetur nisi sint dolor");
  });
});
