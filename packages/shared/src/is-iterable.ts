import { hasTypedField, isTypeOf } from "./is";

declare module "./is" {
  interface TypeOfMap {
    iterable: Iterable<unknown, never, never>;
    asyncIterable: AsyncIterable<unknown, never, never>;
  }
}

/** Tests if value is iterable */
export function isIterable<T, TReturn = never, TNext = never>(value: unknown): value is Iterable<T, TReturn, TNext> {
  return hasTypedField(value, Symbol.iterator, "function");
}
/** Tests if value is async iterable */
isIterable.async = function isAsyncIterable<T, TReturn = never, TNext = never>(value: unknown): value is AsyncIterable<T, TReturn, TNext> {
  return hasTypedField(value, Symbol.asyncIterator, "function");
};
isTypeOf.register("iterable", isIterable);
isTypeOf.register("asyncIterable", isIterable.async);
