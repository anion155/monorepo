import { hasTypedField, is, isTypeOf } from "./is";
import { appendMethod, create } from "./object";

declare module "./is" {
  interface TypeOfMap {
    disposable: Disposable;
    asyncDisposable: AsyncDisposable;
  }
}
/** Tests if value is of Disposable */
export function isDisposable(value: unknown): value is Disposable {
  return hasTypedField(value, Symbol.dispose, "function");
}
/** Tests if value is of AsyncDisposable */
isDisposable.async = function isAsyncDisposable(value: unknown): value is AsyncDisposable {
  return hasTypedField(value, Symbol.asyncDispose, "function");
};
isTypeOf.register("disposable", isDisposable);
isTypeOf.register("asyncDisposable", isDisposable.async);

/** Creates Disposable from AsyncDisposable */
export function disposableFrom(value: AsyncDisposable) {
  if (isDisposable(value)) return value;
  const dispose = () => value[Symbol.asyncDispose]();
  return create(value, { [Symbol.dispose]: dispose });
}

