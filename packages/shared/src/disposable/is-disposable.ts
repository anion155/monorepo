import { hasTypedField, isTypeOf } from "../is";

declare module "../is" {
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
