import { describe, expect, it } from "@jest/globals";

import { InvalidOrderedMap, OrderedMap } from "./ordered-map";

describe("class OrderedMap", () => {
  it("should construct empty", () => {
    const map = new OrderedMap<string, number>();
    expect(map.size).toBe(0);
    expect([...map]).toEqual([]);
  });

  it("should construct from entries", () => {
    const map = new OrderedMap([
      ["a", 1],
      ["b", 2],
    ]);
    expect(map.size).toBe(2);
    expect([...map]).toEqual([
      ["a", 1],
      ["b", 2],
    ]);
  });

  it("should get and set values", () => {
    const map = new OrderedMap<string, number>();
    map.push("x", 10);
    expect(map.get("x")).toBe(10);
    map.push("y", 20);
    expect(map.get("y")).toBe(20);
    expect(map.size).toBe(2);
  });

  it("should maintain insertion order", () => {
    const map = new OrderedMap<string, number>();
    map.push("a", 1);
    map.push("b", 2);
    map.push("c", 3);
    expect([...map]).toEqual([
      ["a", 1],
      ["b", 2],
      ["c", 3],
    ]);
  });

  it("should update value and move to end if key exists", () => {
    const map = new OrderedMap<string, number>();
    expect(map.push("a", 1)).toBe(1);
    expect(map.push("b", 2)).toBe(2);
    expect(map.push("a", 3)).toBe(2);
    expect([...map]).toEqual([
      ["b", 2],
      ["a", 3],
    ]);
    expect(map.push("a", 4, true)).toBe(2);
    expect([...map]).toEqual([
      ["b", 2],
      ["a", 4],
    ]);
  });

  it("should unshift and shift", () => {
    const map = new OrderedMap<string, number>();
    map.unshift("a", 1);
    map.unshift("b", 2);
    expect([...map]).toEqual([
      ["b", 2],
      ["a", 1],
    ]);
    map.unshift("a", 2);
    expect([...map]).toEqual([
      ["a", 2],
      ["b", 2],
    ]);
    map.unshift("c", 1);
    map.unshift("a", 3, true);
    expect([...map]).toEqual([
      ["c", 1],
      ["a", 3],
      ["b", 2],
    ]);
    expect(map.shift()).toEqual(["c", 1]);
    expect([...map]).toEqual([
      ["a", 3],
      ["b", 2],
    ]);
    expect(map.shift()).toEqual(["a", 3]);
    expect(map.shift()).toEqual(["b", 2]);
    expect(map.shift()).toEqual(undefined);
  });

  it("should pop", () => {
    const map = new OrderedMap<string, number>();
    map.push("a", 1);
    map.push("b", 2);
    expect(map.pop()).toEqual(["b", 2]);
    expect(map.pop()).toEqual(["a", 1]);
    expect(map.pop()).toEqual(undefined);
  });

  it("should delete keys", () => {
    const map = new OrderedMap<string, number>();
    map.push("a", 1);
    map.push("b", 2);
    expect(map.delete("a")).toBe(true);
    expect(map.has("a")).toBe(false);
    expect([...map]).toEqual([["b", 2]]);
    expect(map.delete("notfound")).toBe(false);
  });

  it("should clear", () => {
    const map = new OrderedMap([
      ["a", 1],
      ["b", 2],
    ]);
    map.clear();
    expect(map.size).toBe(0);
    expect([...map]).toEqual([]);
  });

  it("should splice", () => {
    const map = new OrderedMap([
      ["a", 1],
      ["b", 2],
      ["c", 3],
    ]);
    expect(map.splice(1, 1, ["x", 9], ["y", 8])).toEqual([["b", 2]]);
    expect([...map]).toEqual([
      ["a", 1],
      ["x", 9],
      ["y", 8],
      ["c", 3],
    ]);
    expect(map.splice(2)).toStrictEqual([
      ["y", 8],
      ["c", 3],
    ]);
  });

  it("should iterate keys, values, and entries", () => {
    const map = new OrderedMap([
      ["a", 1],
      ["b", 2],
    ]);
    expect([...map.keys]).toEqual(["a", "b"]);
    expect([...map.entries]).toEqual([
      ["a", 1],
      ["b", 2],
    ]);
    expect([...map.values]).toEqual([1, 2]);
  });

  it("should set at index", () => {
    const map = new OrderedMap([
      ["a", 1],
      ["b", 2],
      ["c", 3],
    ]);
    map.set(1, "d", 4);
    expect([...map]).toEqual([
      ["a", 1],
      ["d", 4],
      ["c", 3],
    ]);
    map.set(0, "c", 5);
    expect([...map]).toEqual([
      ["c", 5],
      ["d", 4],
    ]);
    map.set(0, "c", 3);
    expect([...map]).toEqual([
      ["c", 3],
      ["d", 4],
    ]);
    map.set(2, "c", 3);
    expect([...map]).toEqual([
      ["d", 4],
      ["c", 3],
    ]);
  });

  it("should keyAt and at", () => {
    const map = new OrderedMap([
      ["a", 1],
      ["b", 2],
    ]);
    expect(map.keyAt(1)).toBe("b");
    expect(map.at(1)).toBe(2);
    expect(map.at(2)).toBeUndefined();
  });

  it("should throw InvalidOrderedMap if internal state is broken", () => {
    const map = new OrderedMap<string, number>();
    map.push("first", 1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call
    (map as any)._private_order.push("order_ghost");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call
    (map as any)._private_map.set("map_ghost", 1);
    expect(() => map.at(1)).toThrow(InvalidOrderedMap);
    expect(() => map.set(0, "map_ghost", 1)).toThrow(InvalidOrderedMap);
    expect(() => map.push("map_ghost", 1)).toThrow(InvalidOrderedMap);
    expect(() => [...map]).toThrow(InvalidOrderedMap);
    expect(() => map.pop()).toThrow(InvalidOrderedMap);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call
    (map as any)._private_order.unshift("order_ghost");
    expect(() => map.unshift("map_ghost", 1)).toThrow(InvalidOrderedMap);
    expect(() => map.shift()).toThrow(InvalidOrderedMap);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call
    (map as any)._private_order.unshift("order_ghost");
    expect(() => map.splice(0)).toThrow(InvalidOrderedMap);
  });
});
