import { isTypeOf } from "./is";
import { isIterable } from "./is-iterable";
import type { Equal, Expect } from "./type-tests";

const value = null as unknown;

if (isIterable(value)) {
  type Case = Expect<Equal<typeof value, Iterable<unknown, never, never>>>;
}
if (isIterable<number, 5, "next">(value)) {
  type Case = Expect<Equal<typeof value, Iterable<number, 5, "next">>>;
}
if (isIterable.async(value)) {
  type Case = Expect<Equal<typeof value, AsyncIterable<unknown, never, never>>>;
}
if (isIterable.async<number, 5, "next">(value)) {
  type Case = Expect<Equal<typeof value, AsyncIterable<number, 5, "next">>>;
}
if (isTypeOf.create("iterable")(value)) {
  type Case = Expect<Equal<typeof value, Iterable<unknown, never, never>>>;
}
if (isTypeOf.create("asyncIterable")(value)) {
  type Case = Expect<Equal<typeof value, AsyncIterable<unknown, never, never>>>;
}
