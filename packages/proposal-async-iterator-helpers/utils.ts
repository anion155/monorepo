import { AsyncIteratorPrototype } from "./async-iterator-prototype";

export function isAsyncIteratorInstance<T, TReturn = unknown, TNext = unknown>(value: object): value is AsyncIteratorObject<T, TReturn, TNext> {
  return Object.prototype.isPrototypeOf.call(AsyncIteratorPrototype, value);
}

export function isAsyncIterable<T>(value: object): value is AsyncIterable<T> {
  return Symbol.asyncIterator in value && typeof value[Symbol.asyncIterator] === "function";
}
