import { describe, expect, it } from "@jest/globals";
import { hasField, hasOwnField, is, isError, isObject, isPromiseLike, isTruthy, isTypeOf } from "./is";

describe("is utils", () => {
  const values = ["test", 55, 55n, true, Symbol(), undefined, null, {}, [], function () {}] as const;
  const resultsTable = (results: { [Index in Extract<keyof typeof values, number>]: boolean }) =>
    values.map((value, index) => [value, results[index]] as const);

  it("isObject() should detect object", () => {
    resultsTable([false, false, false, false, false, false, false, true, true, false]).forEach(([value, result]) =>
      expect(isObject(value)).toBe(result),
    );
  });

  const plainObject = { a: 55 };
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const protoObject: typeof plainObject = Object.create(plainObject);

  it("hasField() should detect field in object", () => {
    const cases = [
      ["a", plainObject, true] as const,
      ["b", plainObject, false] as const,
      ["a", protoObject, true] as const,
      ["b", protoObject, false] as const,
    ] as const;
    cases.forEach(([field, object, result]) => expect(hasField(object, field)).toBe(result));
    cases.forEach(([field, object, result]) => expect(hasField(field)(object)).toBe(result));
  });

  it("hasOwnField() should detect own field in object", () => {
    const cases = [
      ["a", plainObject, true] as const,
      ["b", plainObject, false] as const,
      ["a", protoObject, false] as const,
      ["b", protoObject, false] as const,
    ] as const;
    cases.forEach(([field, object, result]) => expect(hasOwnField(object, field)).toBe(result));
    cases.forEach(([field, object, result]) => expect(hasOwnField(field)(object)).toBe(result));
  });

  it("isTypeOf() should detect value type", () => {
    const results = [
      /* prettier-ignore */ ["string",    resultsTable([true, false, false, false, false, false, false, false, false, false])] as const,
      /* prettier-ignore */ ["number",    resultsTable([false, true, false, false, false, false, false, false, false, false])] as const,
      /* prettier-ignore */ ["bigint",    resultsTable([false, false, true, false, false, false, false, false, false, false])] as const,
      /* prettier-ignore */ ["boolean",   resultsTable([false, false, false, true, false, false, false, false, false, false])] as const,
      /* prettier-ignore */ ["symbol",    resultsTable([false, false, false, false, true, false, false, false, false, false])] as const,
      /* prettier-ignore */ ["undefined", resultsTable([false, false, false, false, false, true, false, false, false, false])] as const,
      /* prettier-ignore */ ["object",    resultsTable([false, false, false, false, false, false, false, true, true, false])] as const,
      /* prettier-ignore */ ["function",  resultsTable([false, false, false, false, false, false, false, false, false, true])] as const,
    ] as const;

    results.forEach(([type, results]) => results.forEach(([value, result]) => expect(isTypeOf(value, type)).toBe(result)));
    results.forEach(([type, results]) => {
      const predicate = isTypeOf(type);
      results.forEach(([value, result]) => expect(predicate(value)).toBe(result));
    });
  });

  it("isError() should detect error", () => {
    class TestError extends Error {}
    TestError.prototype.name = "TestError";

    expect(isError(new TestError(undefined), TestError)).toBe(true);
    expect(isError(Object.assign(new Error(), { name: "TestError" }), TestError)).toBe(true);
    expect(isError({ name: "TestError", message: "test message" }, TestError)).toBe(true);
    expect(isError({ name: "TestError" }, TestError)).toBe(false);
    expect(isError({}, TestError)).toBe(false);

    const isTestError = isError(TestError);

    expect(isTestError(new TestError(undefined))).toBe(true);
    expect(isTestError(Object.assign(new Error(), { name: "TestError" }))).toBe(true);
    expect(isTestError({ name: "TestError", message: "test message" })).toBe(true);
    expect(isTestError({ name: "TestError" })).toBe(false);
    expect(isTestError({})).toBe(false);
  });

  it("is() should detect specified type", () => {
    class TestError extends Error {}
    TestError.prototype.name = "TestError";
    class A {}
    function B() {}

    expect(is("test", "string")).toBe(true);
    expect(is("test", "number")).toBe(false);
    expect(is({}, Object)).toBe(true);
    expect(is(55, Object)).toBe(false);
    expect(is(Object.assign(new Error(), { name: "TestError" }), TestError)).toBe(true);
    expect(is(new Error(), TestError)).toBe(false);
    expect(is(new A(), A)).toBe(true);
    expect(is(undefined, A)).toBe(false);
    expect(is(Reflect.construct(B, []), B as never)).toBe(true);
    expect(is(new A(), B as never)).toBe(false);

    expect(is("string")("test")).toBe(true);
    expect(is("number")("test")).toBe(false);
    expect(is(Object)({})).toBe(true);
    expect(is(Object)("test")).toBe(false);
    expect(is(TestError)(Object.assign(new Error(), { name: "TestError" }))).toBe(true);
    expect(is(TestError)(new Error())).toBe(false);
    expect(is(A)(new A())).toBe(true);
    expect(is(Date)(new A())).toBe(false);
  });

  it("isPromiseLike() should detect promise like objects", () => {
    expect(isPromiseLike(Promise.resolve(undefined))).toBe(true);
    expect(isPromiseLike({ then() {} })).toBe(true);
    expect(isPromiseLike({})).toBe(false);
    expect(isPromiseLike(new Date())).toBe(false);
  });

  it("isTruthy() should detect truthy values", () => {
    expect(isTruthy(null)).toBe(false);
    expect(isTruthy(undefined)).toBe(false);
    expect(isTruthy(false)).toBe(false);
    expect(isTruthy(NaN)).toBe(false);
    expect(isTruthy(0)).toBe(false);
    expect(isTruthy(-0)).toBe(false);
    expect(isTruthy(+0)).toBe(false);
    expect(isTruthy(0n)).toBe(false);
    expect(isTruthy("")).toBe(false);

    expect(isTruthy({})).toBe(true);
    expect(isTruthy(true)).toBe(true);
    expect(isTruthy(5)).toBe(true);
    expect(isTruthy(-5)).toBe(true);
    expect(isTruthy(5n)).toBe(true);
    expect(isTruthy("g")).toBe(true);
  });
});
