/** No operator function. Always returns undefined */
export function noop(): undefined {}

/** Identity function. Always returns first parameter */
export function identity<Value>(value: Value) {
  return value;
}

/**
 * Creates clone of the function.
 * WARNING: Does not hoists function fields or name, but due to limitation of type system ts won't show this.
 */
export function clone<Fn extends Functor<never, unknown>>(fn: Fn): Fn {
  // @ts-expect-error(2322)
  return function (this, ...args) {
    return fn.call(this, ...args);
  };
}

/**
 * Creates function wrapper that hoists fn's fields, name (if new name not provided),
 * but provides own implementation.
 *
 * @example
 * const logWrapper = <Fn extends AnyFunctor>(fn: Fn) => wrapFunctor<Fn>(fn, (...args) => {
 *   log('called with:', ...args);
 *   const result = fn(...args);
 *   log('call result:', result);
 *   return result
 * })
 * const wrapped = logWrapper((a: number, b: string) => `test-${a}-${b}`)
 * wrapped(1, '2') // called with: 1 2
 * // call result: test-1-2
 */
export function wrapFunctor<Fn extends Functor<never, unknown>, Wrapped = InferFunctorSign<Fn>>(fn: Fn, wrapped: Wrapped): Omit<Fn, ""> & Wrapped {
  type _ = InferFunctor<Fn>;
  Object.setPrototypeOf(wrapped, fn);
  if (Object.getOwnPropertyDescriptor(wrapped, "name")) {
    // @ts-expect-error(2704) there is name in fn
    delete wrapped.name;
  }
  return wrapped as never;
}

/**
 * Passes result function's context as first argument.
 *
 * @example
 * const context = { method: listContext((value) => {
 *   assert(value === context)
 * }) }
 * context.method()
 */
export function liftContext<Fn extends Functor<[unknown, ...never], unknown>>(fn: Fn) {
  type FnInferred = InferFunctor<Fn>;
  type Params = TupleUnshift<FnInferred["Params"]>;
  return wrapFunctor<Fn, Method<Params[0], Params[1], FnInferred["Result"]>>(fn, function (this, ...args) {
    // @ts-expect-error(2345)
    return fn(this, ...args);
  });
}

export type Curried<C extends Functor<never, unknown>> = C & { curried: C };
/**
 * Convenient currying helper.
 * Adds property `curry` to  the passed function with same value as passed function.
 * Helps to debug issues of curried functions.
 *
 * WARNING: Does not implement fn-currying of the function
 *
 * @example
 * const fn = <ManualType>() => curryHelper(<AutoType>(b: AutoType) => {})
 * fn<number>()('test')
 * fn<number>().curry('test') // you could see inferred types in second layer function
 */
export function curryHelper<Fn extends Functor<never, unknown>>(fn: Fn): Curried<Fn> {
  return Object.assign(clone(fn), { curried: fn });
}
