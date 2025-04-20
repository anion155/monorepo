import { describe, expect, it } from "@jest/globals";

import { DeveloperError } from "../errors";
import { compare } from "./compare";

describe("compare()", () => {
  it("should shallow compare", () => {
    expect(compare("a", "a", false)).toBe(true);
    expect(compare("a", "b", false)).toBe(false);
  });

  it("should strict compare not object values", () => {
    expect(compare("a", "a", false)).toBe(true);
    expect(compare({}, "b", false)).toBe(false);
  });

  it("should check if objects nullable", () => {
    expect(compare(null, null, false)).toBe(true);
    expect(compare(null, {}, false)).toBe(false);
    expect(compare({}, null, false)).toBe(false);
  });

  it("should check objects prototypes", () => {
    expect(compare({}, {}, false)).toBe(true);
    expect(compare({}, Object.create({}), false)).toBe(false);
  });

  it("should compare object by keys", () => {
    expect(compare({ a: "a" }, { a: "a" }, false)).toBe(true);
    expect(compare({ a: "a" }, { a: "b" }, false)).toBe(false);
  });

  it("should compare object of different length", () => {
    expect(compare({ a: "a", b: 1 }, { a: "a" }, false)).toBe(false);
    expect(compare({ a: "a" }, { a: "a", b: 1 }, false)).toBe(false);
  });

  it("should compare object of different set of keys", () => {
    expect(compare({ a: "a", c: 1 }, { a: "a", b: 1 }, false)).toBe(false);
    expect(compare({ a: "a", b: 1 }, { a: "a", c: 1 }, false)).toBe(false);
  });

  it("should compare deep object", () => {
    expect(compare({ a: { b: "c" } }, { a: { b: "c" } }, true)).toBe(true);
    expect(compare({ a: { b: "c" } }, { a: { b: "d" } }, true)).toBe(false);
  });

  it("without deep should not compare deep object", () => {
    expect(compare({ a: { b: "c" } }, { a: { b: "c" } }, false)).toBe(false);
  });

  it("with numeric deep should compare deep object only on specific layer", () => {
    const a = { a: { b: { c: "d" } } };
    const b = { a: { b: { c: "d" } } };

    expect(compare(a, b, 0)).toBe(false);
    expect(compare(a, b, 1)).toBe(false);
    expect(compare(a, b, 2)).toBe(true);
  });

  it("with negative numeric deep should compare like with true", () => {
    const a = { a: { b: { c: "d" } } };
    const b = { a: { b: { c: "d" } } };
    expect(compare(a, b, -1)).toBe(true);
    expect(compare(a, b, Infinity)).toBe(true);
  });

  it("by default should compare deep", () => {
    const a = { a: { b: { c: "d" } } };
    const b = { a: { b: { c: "d" } } };
    expect(compare(a, b)).toBe(true);
  });

  it("should handle arrays", () => {
    expect(compare(["a"], ["a"], false)).toBe(true);
    expect(compare(["a"], ["b"], false)).toBe(false);
    expect(compare(["a", 1], ["a"], false)).toBe(false);
    expect(compare(["a"], ["a", 1], false)).toBe(false);
    expect(compare(["a", 1], ["a", 1], false)).toBe(true);
    expect(compare([["c"]], [["c"]], true)).toBe(true);
    expect(compare([["c"]], [["d"]], true)).toBe(false);
    expect(compare([["c"]], [["c"]], false)).toBe(false);
    expect(compare([[["d"]]], [[["d"]]], 0)).toBe(false);
    expect(compare([[["d"]]], [[["d"]]], 1)).toBe(false);
    expect(compare([[["d"]]], [[["d"]]], 2)).toBe(true);
    expect(compare([[["d"]]], [[["d"]]], -1)).toBe(true);
    expect(compare([[["d"]]], [[["d"]]], Infinity)).toBe(true);
    expect(compare([[["d"]]], [[["d"]]])).toBe(true);
  });

  it("should handle Map", () => {
    expect(compare(new Map(), new Map(), false)).toBe(true);
    expect(compare(new Map([["a", 1]]), new Map([["a", 1]]), false)).toBe(true);
    expect(compare(new Map([["a", 1]]), new Map([["b", 1]]), false)).toBe(false);
    expect(compare(new Map([["a", 1]]), new Map([["a", 2]]), false)).toBe(false);
    expect(compare(new Map([["a", { b: 2 }]]), new Map([["a", { b: 2 }]]), false)).toBe(false);
    expect(compare(new Map([["a", { b: 2 }]]), new Map([["a", { b: 2 }]]), true)).toBe(true);
    expect(
      compare(
        new Map([
          ["a", 1],
          ["b", 2],
        ]),
        new Map([
          ["b", 2],
          ["a", 1],
        ]),
        true,
      ),
    ).toBe(true);
  });

  it("should handle Set", () => {
    expect(compare(new Set(), new Set(), false)).toBe(true);
    expect(compare(new Set(["a"]), new Set(["a"]), false)).toBe(true);
    expect(compare(new Set(["a"]), new Set(["a", "b"]), false)).toBe(false);
    expect(compare(new Set(["a"]), new Set(["b"]), false)).toBe(false);
    expect(compare(new Set(["a", 1]), new Set(["a", 1]), false)).toBe(true);
    expect(compare(new Set(["b", "a", 1]), new Set(["a", 1, "b"]), false)).toBe(true);
    expect(compare(new Set(["a", { b: 1 }]), new Set(["a", { b: 1 }]), false)).toBe(false);
    expect(compare(new Set(["a", { b: 1 }]), new Set(["a", { b: 1 }]), true)).toBe(true);
    expect(compare(new Set([{ a: 1 }, { b: 2 }]), new Set([{ b: 2 }, { a: 2 }]), true)).toBe(false);
  });

  it("should throw when trying to compare Weak storages", () => {
    expect(() => compare(new WeakMap(), new WeakMap(), false)).toStrictThrow(new DeveloperError("can't compare weak storages"));
    expect(() => compare(new WeakSet(), new WeakSet(), false)).toStrictThrow(new DeveloperError("can't compare weak storages"));
  });

  it("should detect different types", () => {
    const i = (...v: Array<unknown>) => v[Symbol.iterator]();
    expect(compare(i(1, 2), i(["a", 1], ["b", 2]), false)).toBe(false);
    expect(compare(i(["a", 1], ["b", 2]), i(1, 2), false)).toBe(false);
  });

  it("should handle entries iterables", () => {
    const i = (...v: Array<unknown>) => v[Symbol.iterator]();
    expect(compare(i(["a", 1], ["b", 2]), i(["a", 1], ["b", 2]), false)).toBe(true);
    expect(compare(i(["a", 1], ["b", 2]), i(["b", 2], ["a", 1]), false)).toBe(false);
    expect(compare(i(["a", 1]), i(["a", 1], ["b", 2]), false)).toBe(false);
    expect(compare(i(["a", { b: 1 }]), i(["a", { b: 2 }]), false)).toBe(false);
  });

  it("should handle iterables", () => {
    const i = (...v: Array<unknown>) => v[Symbol.iterator]();
    expect(compare(i(1, 2), i(1, 2), false)).toBe(true);
    expect(compare(i(1, 2), i(2, 1), false)).toBe(false);
    expect(compare(i(1, 2), i(1), false)).toBe(false);
    expect(compare(i(1), i(1, 2), false)).toBe(false);
  });
});
