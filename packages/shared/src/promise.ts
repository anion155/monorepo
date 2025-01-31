import { createErrorClass } from "./errors";
import { hasTypedField, isTypeOf } from "./is";

declare module "./is" {
  interface TypeOfMap {
    promise: PromiseLike<unknown>;
  }
}
/** Tests if value is promise like */
export function isPromiseLike<T>(value: unknown): value is PromiseLike<T> {
  return hasTypedField(value, "then", "function");
}
isTypeOf.register("promise", isPromiseLike);

/** Tests if promise is pending */
export function isPromisePending(promise: Promise<unknown>) {
  const unique = {};
  return Promise.race([promise, Promise.resolve(unique)]).then(
    (result) => result === unique,
    () => false,
  );
}

export class TimeoutError extends createErrorClass("TimeoutError", "timed out") {}
