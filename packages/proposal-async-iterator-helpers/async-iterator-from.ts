import { isIterable } from "@anion155/proposal-iterator-helpers/utils";

import { polyfillProperty } from "@anion155/polyfill-base";
import { AsyncIteratorConstructor } from "./async-iterator-constructor";
import { isAsyncIterable, isAsyncIteratorInstance } from "./utils";

import "@anion155/proposal-iterator-helpers";
import { IteratorConstructor } from "@anion155/proposal-iterator-helpers";
import { AsyncIteratorPrototype } from "./async-iterator-prototype";

// if (typeof AsyncIteratorConstructor.from !== "function") {

//   const target = Symbol();

//   const done = Symbol();
//   const WrapForValidAsyncIteratorPrototype: WrapForValidAsyncIterator<unknown, unknown, unknown> = Object.create(
//     AsyncIteratorPrototype,
//     {
//       [done]: {
//         value: false,
//         writable: true,
//         enumerable: false,
//       },
//       next: {
//         value: async function next(...args: [] | [any]) {
//           if (this[done]) {
//             return Promise.resolve({ done: true, value: undefined });
//           }
//           return this[target].next(...args);
//         },
//       },
//       return: {
//         value: async function returnMethod(value?: any) {
//           this[done] = true;
//           return this[target].return?.(await value) ?? { done: true };
//         },
//       },
//       throw: {
//         value: async function throwMethod(error?: any) {
//           this[done] = true;
//           if (!this[target].throw) throw error;
//           return this[target].throw(error);
//         },
//       },
//     },
//   );

//   AsyncIteratorConstructor.from = function from<T, TReturn = any, TNext = undefined>(
//     it: AsyncIterator<T, TReturn, TNext> | AsyncIteratorLike<T, TReturn, TNext> | AsyncIterable<T> | Iterable<T>,
//   ): AsyncIterator<T, TReturn, TNext> | WrapForValidAsyncIterator<T, TReturn, TNext> {

//   };
// }

const doneKey = Symbol.for("proxy-async-iterator-done");
const targetKey = Symbol.for("proxy-async-iterator-target");

type ProxyAsyncIterator<T, TReturn = unknown, TNext = unknown> = Iterator<T, TReturn, TNext> & {
  [doneKey]: boolean;
  readonly [targetKey]: Iterator<T, TReturn, TNext>;
};

function ProxyAsyncIterator<T, TReturn = unknown, TNext = unknown>(
  this: ProxyAsyncIterator<T, TReturn, TNext>,
  target: AsyncIterator<T, TReturn, TNext>,
) {
  this[doneKey] = false;
  polyfillProperty(this, targetKey, { value: target, writable: false });
}
ProxyAsyncIterator.prototype = Object.create(AsyncIteratorPrototype, {
  next: {
    value: async function proxyNext(this: ProxyAsyncIterator<unknown, unknown, unknown>, value: unknown) {
      if (this[doneKey]) return { done: true, value: undefined };
      return this[targetKey].next(await value);
    },
  },
  return: {
    value: async function proxyReturn(this: ProxyAsyncIterator<unknown, unknown, unknown>, value?: unknown) {
      this[doneKey] = true;
      if (!this[targetKey].return) return { value: await value, done: true };
      return this[targetKey].return?.(value);
    },
  },
  throw: {
    value: function proxyThrow(this: ProxyAsyncIterator<unknown, unknown, unknown>, error?: unknown) {
      this[doneKey] = true;
      // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
      if (!this[targetKey].throw) return Promise.reject(error);
      return this[targetKey].throw(error);
    },
  },
}) as ProxyAsyncIterator<unknown, unknown, unknown>;

polyfillProperty(AsyncIteratorConstructor, "from", {
  value: function from<T, TReturn = unknown, TNext = unknown>(
    it: Iterator<T, TReturn, TNext> | Iterable<T> | AsyncIterator<T, TReturn, TNext> | AsyncIterable<T>,
  ): AsyncIteratorObject<T, TReturn, TNext> {
    if (isAsyncIteratorInstance<T, TReturn, TNext>(it)) return it;
    if (!isAsyncIterable<T>(it) && isIterable<T>(it)) return IteratorConstructor.from<T, TReturn, TNext>(it).toAsync();
    const iterator = isAsyncIterable(it) ? it[Symbol.asyncIterator]() : it;
    if (isAsyncIteratorInstance<T, TReturn, TNext>(iterator)) return iterator;
    return Reflect.construct(ProxyAsyncIterator, [iterator]) as never;
  },
});

export {};
