import { AsyncIteratorPrototype } from "./async-iterator-prototype";

export const IteratorPrototype = Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]())) as Iterator<unknown>;

export const IteratorConstructor = IteratorPrototype.constructor as never as (abstract new <T, TReturn = unknown, TNext = unknown>() => Iterator<
  T,
  TReturn,
  TNext
>) & {
  from<T, TReturn = unknown, TNext = unknown>(it: Iterator<T, TReturn, TNext> | Iterable<T, TReturn, TNext>): IteratorObject<T, TReturn, TNext>;
};

export function isIterable<T>(value: object): value is Iterable<T> {
  return Symbol.iterator in value && typeof value[Symbol.iterator] === "function";
}

export function isAsyncIteratorInstance<T, TReturn = unknown, TNext = unknown>(value: object): value is AsyncIteratorObject<T, TReturn, TNext> {
  return Object.prototype.isPrototypeOf.call(AsyncIteratorPrototype, value);
}

export function isAsyncIterable<T>(value: object): value is AsyncIterable<T> {
  return Symbol.asyncIterator in value && typeof value[Symbol.asyncIterator] === "function";
}
