import { isTypeOf } from "./is";
import { isPromise, isPromiseLike } from "./promise";
import type { Equal, Expect } from "./type-tests";

const value = null as unknown;

if (isPromiseLike(value)) {
  type Case = Expect<Equal<typeof value, PromiseLike<unknown>>>;
}
if (isPromiseLike<number>(value)) {
  type Case = Expect<Equal<typeof value, PromiseLike<number>>>;
}
if (isTypeOf(value, "promiseLike")) {
  type Case = Expect<Equal<typeof value, PromiseLike<unknown>>>;
}
if (isTypeOf.create("promiseLike")(value)) {
  type Case = Expect<Equal<typeof value, PromiseLike<unknown>>>;
}

if (isPromise(value)) {
  type Case = Expect<Equal<typeof value, Promise<unknown>>>;
}
if (isPromise<number>(value)) {
  type Case = Expect<Equal<typeof value, Promise<number>>>;
}
if (isTypeOf(value, "promise")) {
  type Case = Expect<Equal<typeof value, Promise<unknown>>>;
}
if (isTypeOf.create("promise")(value)) {
  type Case = Expect<Equal<typeof value, Promise<unknown>>>;
}
