import { createErrorClass } from "./errors";
import { hasTypedField, is, isTypeOf } from "./is";

declare module "./is" {
  interface TypeOfMap {
    promiseLike: PromiseLike<unknown>;
    promise: Promise<unknown>;
  }
}
/** Tests if value is promise like */
export function isPromiseLike<T>(value: unknown): value is PromiseLike<T> {
  return hasTypedField(value, "then", "function");
}
isTypeOf.register("promiseLike", isPromiseLike);

/** Tests if value is promise */
export function isPromise<T>(value: unknown): value is Promise<T> {
  return is(value, Promise);
}
isTypeOf.register("promise", isPromise);

/** Tests if promise is pending */
export function isPromisePending(promise: Promise<unknown>) {
  const unique = {};
  return Promise.race([promise, Promise.resolve(unique)]).then(
    (result) => result === unique,
    () => false,
  );
}

export class TimeoutError extends createErrorClass("TimeoutError", "timed out") {}
