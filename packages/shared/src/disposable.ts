import "@global/disposable";

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

const disposableStacks = new WeakMap<object, DisposableStack>();
const asyncDisposableStacks = new WeakMap<object, AsyncDisposableStack>();
/**
 * Append disposables to value's dispose.
 *  - if value is DisposableStack or AsyncDisposableStack just appends disposables to stack
 *  - if appendDispose or appendDispose.async was called with this value before, appends to stack stored in WeakMap
 *  - else stores DisposableStack in WeakMap and adds Symbol.dispose method to value,
 *    if value is Disposable also adds it first to the stack
 */
export function appendDispose<Value extends object>(value: Value, ...disposables: Array<DisposableStackArgument>) {
  if (is(value, DisposableStack) || is(value, AsyncDisposableStack)) {
    value.append(...disposables);
  } else if (disposableStacks.has(value)) {
    disposableStacks.get(value)!.append(...disposables);
  } else if (asyncDisposableStacks.has(value)) {
    asyncDisposableStacks.get(value)!.append(...disposables);
  } else {
    const stack = new DisposableStack();
    disposableStacks.set(value, stack);
    if (isDisposable(value)) stack.append(() => value[Symbol.dispose]());
    stack.append(...disposables);
    appendMethod(value, Symbol.dispose, () => stack.dispose());
  }
}
/**
 * Append async disposables to value's disposeAsync.
 *  - if value is AsyncDisposableStack just appends disposables to stack
 *  - if appendDispose.async was called with this value before, appends to stack stored in WeakMap
 *  - else stores AsyncDisposableStack in WeakMap, adds Symbol.asyncDispose method to value,
 *    removes Symbol.dispose method from value,
 *    if value is Disposable or AsyncDisposable also adds it first to the stack
 */
appendDispose.async = function appendDisposeAsync<Value extends object>(value: Value, ...disposables: Array<AsyncDisposableStackArgument>) {
  if (is(value, AsyncDisposableStack)) {
    value.append(...disposables);
  } else if (asyncDisposableStacks.has(value)) {
    asyncDisposableStacks.get(value)!.append(...disposables);
  } else {
    const stack = new AsyncDisposableStack();
    asyncDisposableStacks.set(value, stack);
    if (isDisposable.async(value)) stack.append(() => value[Symbol.asyncDispose]());
    if (isDisposable(value)) {
      const dispose = value[Symbol.dispose];
      stack.append(() => dispose.call(value));
      // @ts-expect-error(2790) - deletes old Symbol.dispose method
      delete value[Symbol.dispose];
    }
    stack.append(...disposables);
    appendMethod(value, Symbol.asyncDispose, () => stack.disposeAsync());
  }
};
