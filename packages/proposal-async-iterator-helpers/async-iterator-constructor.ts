import { polyfill } from "@anion155/polyfill-base";

import { AsyncIteratorPrototype } from "./async-iterator-prototype";
import { isAsyncIteratorInstance } from "./utils";

polyfill("constructor" in AsyncIteratorPrototype, () => {
  const AsyncIteratorPolyfill = function AsyncIterator(this: AsyncIterator<unknown>): AsyncIterator<unknown> {
    if (!isAsyncIteratorInstance(this)) throw new TypeError("Constructor AsyncIterator requires 'new'");
    if (Object.getPrototypeOf(this) === AsyncIteratorPrototype) {
      throw new TypeError("Abstract class AsyncIterator not directly constructable");
    }
    return this;
  };
  AsyncIteratorPolyfill.prototype = AsyncIteratorPrototype;
  Object.defineProperty(AsyncIteratorPrototype, "constructor", { value: AsyncIteratorPolyfill });
});

export const AsyncIteratorConstructor = AsyncIteratorPrototype.constructor as never as (abstract new <
  T,
  TReturn = unknown,
  TNext = unknown,
>() => AsyncIterator<T, TReturn, TNext>) & {
  from<T, TReturn = unknown, TNext = unknown>(
    it: Iterator<T, TReturn, TNext> | Iterable<T> | AsyncIterator<T, TReturn, TNext> | AsyncIterable<T>,
  ): AsyncIteratorObject<T, TReturn, TNext>;
};
