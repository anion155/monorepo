import { isTypeOf } from "../is";
import type { Equal, Expect } from "../type-tests";
import { isDisposable } from "./is-disposable";

const value = null as unknown;

if (isDisposable(value)) {
  type Case = Expect<Equal<typeof value, Disposable>>;
}
if (isTypeOf(value, "disposable")) {
  type Case = Expect<Equal<typeof value, Disposable>>;
}

if (isDisposable.async(value)) {
  type Case = Expect<Equal<typeof value, AsyncDisposable>>;
}
if (isTypeOf.create("asyncDisposable")(value)) {
  type Case = Expect<Equal<typeof value, AsyncDisposable>>;
}
