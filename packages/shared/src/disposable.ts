import "@global/disposable";

import { hasTypedField, is, isTypeOf } from "./is";
import { create } from "./object";

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

/**
 * Append disposables to {@link value}'s dispose.
 *  - if {@link value} is {@link DisposableStack} or {@link AsyncDisposableStack} just appends disposables to stack
 *  - if {@link appendDispose} was called with this {@link value} before, appends to stack stored in {@link DisposableStack.stamped}
 *  - if {@link appendDispose.async} was called with this {@link value} before, appends to stack stored in {@link AsyncDisposableStack.stamped}
 *  - else stamps {@link value} with DisposableStack.stamped
 */
export function appendDispose<Value extends object>(value: Value, ...disposables: Array<DisposableStackArgument>) {
  if (is(value, DisposableStack) || is(value, AsyncDisposableStack)) {
    value.append(...disposables);
  } else if (DisposableStack.stamper.is(value)) {
    DisposableStack.stamper.get(value).append(...disposables);
  } else if (AsyncDisposableStack.stamper.is(value)) {
    AsyncDisposableStack.stamper.get(value).append(...disposables);
  } else {
    DisposableStack.stamper.stamp(value as never).append(...disposables);
  }
}
/**
 * Append async disposables to {@link value}'s disposeAsync.
 *  - if {@link value} is {@link AsyncDisposableStack} just appends disposables to stack
 *  - if {@link appendDispose.async} was called with this {@link value} before, appends to stack stored in {@link AsyncDisposableStack.stamped}
 *  - else stamps {@link value} with {@link AsyncDisposableStack.stamped},
 *    if {@link value} is {@link Disposable} or {@link AsyncDisposable} also adds it first to the stack
 */
appendDispose.async = function appendDisposeAsync<Value extends object>(value: Value, ...disposables: Array<AsyncDisposableStackArgument>) {
  if (is(value, AsyncDisposableStack)) {
    value.append(...disposables);
  } else if (AsyncDisposableStack.stamper.is(value)) {
    AsyncDisposableStack.stamper.get(value).append(...disposables);
  } else {
    AsyncDisposableStack.stamper.stamp(value as never).append(...disposables);
  }
};
