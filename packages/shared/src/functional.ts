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
  // @ts-expect-error(2322): types are intentionally broken
  return function (this, ...params) {
    return fn.call(this, ...params);
  };
}

/**
 * Creates function wrapper that hoists fn's fields, name (if new name not provided),
 * but provides own implementation.
 *
 * @example
 * const logWrapper = <Fn extends AnyFunctor>(fn: Fn) => wrapFunctor<Fn>(fn, (...params) => {
 *   log('called with:', ...params);
 *   const result = fn(...params);
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
    // @ts-expect-error(2704): there is name in fn
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
  return wrapFunctor<Fn, Method<Params[0], Params[1], FnInferred["Result"]>>(fn, function (this, ...params) {
    // @ts-expect-error(2345): types are intentionally broken
    return fn(this, ...params);
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

export type PipeFunctor<Params extends unknown[], Result> = {
  (...params: Params): Result;
  create(): (...params: Params) => Result;
  pipe: {
    /* prettier-ignore */ <Next1>
    /* prettier-ignore */ (fn1: Functor<[Result], Next1>): PipeFunctor<Params, Next1>;
    /* prettier-ignore */ <Next1, Next2>
    /* prettier-ignore */ (fn1: Functor<[Result], Next1>, fn2: Functor<[Next1], Next2>): PipeFunctor<Params, Next2>;
    /* prettier-ignore */ <Next1, Next2, Next3>
    /* prettier-ignore */ (fn1: Functor<[Result], Next1>, fn2: Functor<[Next1], Next2>, fn3: Functor<[Next2], Next3>): PipeFunctor<Params, Next3>;
    /* prettier-ignore */ <Next1, Next2, Next3, Next4>
    /* prettier-ignore */ (fn1: Functor<[Result], Next1>, fn2: Functor<[Next1], Next2>, fn3: Functor<[Next2], Next3>, fn4: Functor<[Next3], Next4>): PipeFunctor<Params, Next4>;
    /* prettier-ignore */ <Next1, Next2, Next3, Next4, Next5>
    /* prettier-ignore */ (fn1: Functor<[Result], Next1>, fn2: Functor<[Next1], Next2>, fn3: Functor<[Next2], Next3>, fn4: Functor<[Next3], Next4>, fn5: Functor<[Next4], Next5>): PipeFunctor<Params, Next5>;
    /* prettier-ignore */ <Next1, Next2, Next3, Next4, Next5, Next6>
    /* prettier-ignore */ (fn1: Functor<[Result], Next1>, fn2: Functor<[Next1], Next2>, fn3: Functor<[Next2], Next3>, fn4: Functor<[Next3], Next4>, fn5: Functor<[Next4], Next5>, fn6: Functor<[Next5], Next6>): PipeFunctor<Params, Next6>;
    /* prettier-ignore */ <Next1, Next2, Next3, Next4, Next5, Next6, Next7>
    /* prettier-ignore */ (fn1: Functor<[Result], Next1>, fn2: Functor<[Next1], Next2>, fn3: Functor<[Next2], Next3>, fn4: Functor<[Next3], Next4>, fn5: Functor<[Next4], Next5>, fn6: Functor<[Next5], Next6>, fn7: Functor<[Next6], Next7>): PipeFunctor<Params, Next7>;
    /* prettier-ignore */ <Next1, Next2, Next3, Next4, Next5, Next6, Next7, Next8>
    /* prettier-ignore */ (fn1: Functor<[Result], Next1>, fn2: Functor<[Next1], Next2>, fn3: Functor<[Next2], Next3>, fn4: Functor<[Next3], Next4>, fn5: Functor<[Next4], Next5>, fn6: Functor<[Next5], Next6>, fn7: Functor<[Next6], Next7>, fn8: Functor<[Next7], Next8>): PipeFunctor<Params, Next7>;
    /* prettier-ignore */ <Next1, Next2, Next3, Next4, Next5, Next6, Next7, Next8, Next9>
    /* prettier-ignore */ (fn1: Functor<[Result], Next1>, fn2: Functor<[Next1], Next2>, fn3: Functor<[Next2], Next3>, fn4: Functor<[Next3], Next4>, fn5: Functor<[Next4], Next5>, fn6: Functor<[Next5], Next6>, fn7: Functor<[Next6], Next7>, fn8: Functor<[Next7], Next8>, fn9: Functor<[Next8], Next9>): PipeFunctor<Params, Next9>;
  };
  method<Name extends MethodsKeys<Pick<Result, keyof Result>>>(
    name: Name,
    ...params: InferMethod<Result[Name]>["Params"]
  ): PipeFunctor<Params, InferMethod<Result[Name]>["Result"]>;
};
function createPipe<Params extends unknown[], Result>(
  head: Functor<Params, unknown>,
  body: Functor<[unknown], unknown>[],
): PipeFunctor<Params, Result> {
  const create =
    () =>
    (...params: Params) =>
      body.reduce((prev, fn) => fn(prev), head(...params));
  const pipe = (...next: Functor<[unknown], unknown>[]) => createPipe(head, [...body, ...next] as never);
  // @ts-expect-error(18046): value is previous result
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const method = (name: string, ...params: unknown[]) => pipe((value) => value[name](...params));
  return Object.assign(create(), { create, pipe, method }) as never;
}
/* prettier-ignore */ export function pipe<Params extends unknown[], Result>
/* prettier-ignore */ (fn: Functor<Params, Result>): PipeFunctor<Params, Result>;
/* prettier-ignore */ export function pipe<Params extends unknown[], Result1, Result2>
/* prettier-ignore */ (fn1: Functor<Params, Result1>, fn2: Functor<[Result1], Result2>): PipeFunctor<Params, Result2>;
/* prettier-ignore */ export function pipe<Params extends unknown[], Result1, Result2, Result3>
/* prettier-ignore */ (fn1: Functor<Params, Result1>, fn2: Functor<[Result1], Result2>, fn3: Functor<[Result2], Result3>): PipeFunctor<Params, Result3>;
/* prettier-ignore */ export function pipe<Params extends unknown[], Result1, Result2, Result3, Result4>
/* prettier-ignore */ (fn1: Functor<Params, Result1>, fn2: Functor<[Result1], Result2>, fn3: Functor<[Result2], Result3>, fn4: Functor<[Result3], Result4>): PipeFunctor<Params, Result4>;
/* prettier-ignore */ export function pipe<Params extends unknown[], Result1, Result2, Result3, Result4, Result5>
/* prettier-ignore */ (fn1: Functor<Params, Result1>, fn2: Functor<[Result1], Result2>, fn3: Functor<[Result2], Result3>, fn4: Functor<[Result3], Result4>, fn5: Functor<[Result4], Result5>): PipeFunctor<Params, Result5>;
/* prettier-ignore */ export function pipe<Params extends unknown[], Result1, Result2, Result3, Result4, Result5, Result6>
/* prettier-ignore */ (fn1: Functor<Params, Result1>, fn2: Functor<[Result1], Result2>, fn3: Functor<[Result2], Result3>, fn4: Functor<[Result3], Result4>, fn5: Functor<[Result4], Result5>, fn6: Functor<[Result5], Result6>): PipeFunctor<Params, Result6>;
/* prettier-ignore */ export function pipe<Params extends unknown[], Result1, Result2, Result3, Result4, Result5, Result6, Result7>
/* prettier-ignore */ (fn1: Functor<Params, Result1>, fn2: Functor<[Result1], Result2>, fn3: Functor<[Result2], Result3>, fn4: Functor<[Result3], Result4>, fn5: Functor<[Result4], Result5>, fn6: Functor<[Result5], Result6>, fn7: Functor<[Result6], Result7>): PipeFunctor<Params, Result7>;
/* prettier-ignore */ export function pipe<Params extends unknown[], Result1, Result2, Result3, Result4, Result5, Result6, Result7, Result8>
/* prettier-ignore */ (fn1: Functor<Params, Result1>, fn2: Functor<[Result1], Result2>, fn3: Functor<[Result2], Result3>, fn4: Functor<[Result3], Result4>, fn5: Functor<[Result4], Result5>, fn6: Functor<[Result5], Result6>, fn7: Functor<[Result6], Result7>, fn8: Functor<[Result7], Result8>): PipeFunctor<Params, Result8>;
/* prettier-ignore */ export function pipe<Params extends unknown[], Result1, Result2, Result3, Result4, Result5, Result6, Result7, Result8, Result9>
/* prettier-ignore */ (fn1: Functor<Params, Result1>, fn2: Functor<[Result1], Result2>, fn3: Functor<[Result2], Result3>, fn4: Functor<[Result3], Result4>, fn5: Functor<[Result4], Result5>, fn6: Functor<[Result5], Result6>, fn7: Functor<[Result6], Result7>, fn8: Functor<[Result7], Result8>, fn9: Functor<[Result8], Result9>): PipeFunctor<Params, Result9>;
export function pipe(head: Functor<unknown[], unknown>, ...body: Functor<[unknown], unknown>[]) {
  return createPipe(head, body);
}

const reducedSymbol = Symbol.for("reduced");
/**
 * Reduce function able to stop execution
 *
 * @example
 * reduce([0,1,2,3,2,4], (arr, value, reduced) => {
 *   if (value > 2) reduced(arr);
 *   arr.push(value);
 *   return arr;
 * }, [] as number[]); // [0,1,2]
 */
export function reduce<Value, Result>(
  values: Iterable<Value>,
  reducer: (reduced: Result, value: Value, index: number, reduce: (result: Result) => never) => Result,
  initial: Result,
): Result {
  try {
    const iterator = values[Symbol.iterator]();
    let results = iterator.next();
    let reduced: Result = initial;
    let index = 0;
    while (!results.done) {
      reduced = reducer(reduced, results.value, index, (result) => {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw { [reducedSymbol]: result };
      });
      index += 1;
      results = iterator.next();
    }
    return reduced;
  } catch (error) {
    if (typeof error === "object" && error !== null && reducedSymbol in error) {
      return error[reducedSymbol] as Result;
    }
    throw error;
  }
}
reduce.plain = function reducePlain<Value>(
  values: Iterable<Value>,
  reducer: (reduced: Value, value: Value, index: number, reduce: (result: Value) => never) => Value,
) {
  const iterator = values[Symbol.iterator]();
  const iterable = Object.create(iterator, { [Symbol.iterator]: { value: () => iterator } }) as Iterable<Value>;
  const results = iterator.next();
  if (results.done) throw new TypeError("reduce.plain can't handle empty iterable");
  return reduce(iterable, (reduced, value, index, reduce) => reducer(reduced, value, index + 1, reduce), results.value);
};
