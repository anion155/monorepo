import { Equal, Expect } from "../type-tests";
import { hasField, hasTypedField, is, isError, isObject, isTypeOf } from "./is";

const value = null as unknown;

if (isObject(value) && hasField.create("a")(value)) {
  type Case = Expect<Equal<typeof value, { a: unknown }>>;
}
if (isObject(value) && hasField.own.create("a")(value)) {
  type Case = Expect<Equal<typeof value, { a: unknown }>>;
}

if (isTypeOf.create("string")(value)) {
  type Case = Expect<Equal<typeof value, string>>;
}
if (isTypeOf.create("number")(value)) {
  type Case = Expect<Equal<typeof value, number>>;
}
if (isTypeOf.create("bigint")(value)) {
  type Case = Expect<Equal<typeof value, bigint>>;
}
if (isTypeOf.create("boolean")(value)) {
  type Case = Expect<Equal<typeof value, boolean>>;
}
if (isTypeOf.create("symbol")(value)) {
  type Case = Expect<Equal<typeof value, symbol>>;
}
if (isTypeOf.create("undefined")(value)) {
  type Case = Expect<Equal<typeof value, undefined>>;
}
if (isTypeOf.create("object")(value)) {
  type Case = Expect<Equal<typeof value, object>>;
}
if (isTypeOf.create("function")(value)) {
  type Case = Expect<Equal<typeof value, Callable<unknown[], unknown>>>;
}

class TestError extends Error {}
if (isError.create(TestError)(value)) {
  type Case = Expect<Equal<typeof value, TestError>>;
}

class A {}
if (is.create(Object)(value)) {
  type Case = Expect<Equal<typeof value, object>>;
}
if (is.create("string")(value)) {
  type Case = Expect<Equal<typeof value, string>>;
}
if (is.create(A)(value)) {
  type Case = Expect<Equal<typeof value, A>>;
}

if (hasTypedField.create("test", "function")(value)) {
  type Case = Expect<Equal<typeof value, { test: Callable<unknown[], unknown> }>>;
}
