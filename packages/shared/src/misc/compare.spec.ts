import { describe, expect, it } from "@jest/globals";

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
});
