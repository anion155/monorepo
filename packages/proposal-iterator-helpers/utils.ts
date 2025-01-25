import { IteratorPrototype } from "./iterator-prototype";

export function isIteratorInstance<T, TReturn = unknown, TNext = unknown>(value: object): value is IteratorObject<T, TReturn, TNext> {
  return Object.prototype.isPrototypeOf.call(IteratorPrototype, value);
}

export function isIterable<T>(value: object): value is Iterable<T> {
  return Symbol.iterator in value && typeof value[Symbol.iterator] === "function";
}
