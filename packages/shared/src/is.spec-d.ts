import { Equal, Expect } from "type-tests";
import { hasField, hasTypedField, is, isError, isObject, isPromiseLike, isTruthy, isTypeOf } from "./is";

const value = null as unknown;

if (isObject(value)) {
  type Case = Expect<Equal<typeof value, object>>;
}

if (isObject(value) && hasField(value, "a")) {
  type Case = Expect<Equal<typeof value, { a: unknown }>>;
}
if (isObject(value) && hasField.own(value, "a")) {
  type Case = Expect<Equal<typeof value, { a: unknown }>>;
}

if (isTypeOf(value, "string")) {
  type Case = Expect<Equal<typeof value, string>>;
}
if (isTypeOf(value, "number")) {
  type Case = Expect<Equal<typeof value, number>>;
}
if (isTypeOf(value, "bigint")) {
  type Case = Expect<Equal<typeof value, bigint>>;
}
if (isTypeOf(value, "boolean")) {
  type Case = Expect<Equal<typeof value, boolean>>;
}
if (isTypeOf(value, "symbol")) {
  type Case = Expect<Equal<typeof value, symbol>>;
}
if (isTypeOf(value, "undefined")) {
  type Case = Expect<Equal<typeof value, undefined>>;
}
if (isTypeOf(value, "object")) {
  type Case = Expect<Equal<typeof value, object>>;
}
if (isTypeOf(value, "function")) {
  type Case = Expect<Equal<typeof value, Callable<unknown[], unknown>>>;
}
if (isTypeOf(value, "promise")) {
  type Case = Expect<Equal<typeof value, PromiseLike<unknown>>>;
}

class TestError extends Error {}
if (isError(value, TestError)) {
  type Case = Expect<Equal<typeof value, TestError>>;
}

class A {}
if (is(value, Object)) {
  type Case = Expect<Equal<typeof value, object>>;
}
if (is(value, "string")) {
  type Case = Expect<Equal<typeof value, string>>;
}
if (is(value, A)) {
  type Case = Expect<Equal<typeof value, A>>;
}

if (isPromiseLike(value)) {
  type Case = Expect<Equal<typeof value, PromiseLike<unknown>>>;
}
const maybePromise = null as never as Promise<number> | undefined;
if (isPromiseLike(maybePromise)) {
  type Case = Expect<Equal<typeof maybePromise, Promise<number>>>;
}

const isTruthyFilterCase = new Array<"A" | "B" | undefined>().filter(isTruthy);
type IsTruthyFilterCase = Expect<Equal<typeof isTruthyFilterCase, Array<"A" | "B">>>;

if (hasTypedField(value, "test", "function")) {
  type Case = Expect<Equal<typeof value, { test: Callable<unknown[], unknown> }>>;
}
