import { describe, expect, it } from "@jest/globals";

import { is } from "./is";
import { isIterable } from "./is-iterable";

describe("isIterable()", () => {
  it("should test if value is iterable", () => {
    expect(isIterable([])).toBe(true);
    expect(isIterable({})).toBe(false);
    expect(isIterable({ *[Symbol.iterator]() {} })).toBe(true);
    expect(is([], "iterable")).toBe(true);
    expect(is({}, "iterable")).toBe(false);
    expect(is({ *[Symbol.iterator]() {} }, "iterable")).toBe(true);
  });

  it("should test if value is async iterable", () => {
    expect(isIterable.async((async function* () {})())).toBe(true);
    expect(isIterable.async([])).toBe(false);
    expect(isIterable.async({})).toBe(false);
    expect(isIterable.async({ *[Symbol.asyncIterator]() {} })).toBe(true);
    expect(is((async function* () {})(), "asyncIterable")).toBe(true);
    expect(is([], "asyncIterable")).toBe(false);
    expect(is({}, "asyncIterable")).toBe(false);
    expect(is({ *[Symbol.asyncIterator]() {} }, "asyncIterable")).toBe(true);
  });
});
