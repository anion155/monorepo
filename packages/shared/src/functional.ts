/** No operator function. Always returns undefined */
export function noop(): undefined {}

/** Identity function. Always returns first parameter */
export function identity<Value>(value: Value) {
  return value;
}

/** Change callable's name. */
export function nameCallable<Fn extends Callable<never, unknown>>(name: string, fn: Fn): Fn {
  Object.defineProperty(fn, "name", { value: name, writable: false, enumerable: false, configurable: true });
  return fn;
}

type CallableProxyFabricCall<Fn extends Callable<never, unknown>> = (
  fn: Fn,
  params: InferCallable<Fn>["Params"],
  context: InferMethod<Fn>["Context"],
  newTarget: Fn | undefined,
) => InferCallable<Fn>["Result"];
type CallableProxyFabricGetTarget<Fn extends Callable<never, unknown>> = (fn: Fn, newTarget: Fn | undefined) => Fn | undefined;
export type CallableProxyFabric<Fn extends Callable<never, unknown>> = (
  call: CallableProxyFabricCall<Fn>,
  getTarget: CallableProxyFabricGetTarget<Fn>,
) => Fn;
/**
 * Helper function to proxy callables. Can be used to create clones of some other functions.
 * {@link fabric} accepts {@link call} as it's first argument. Let's you call other functions or construct values.
 *
 * @example
 * const spy = (fn) => proxyCallable(call => function (this, ...params) {
 *   if (!spy.calls) spy.calls = [params]
 *   else spy.calls.push(params)
 *   try {
 *     const result = call(fn, params, this, new.target);
 *     if (!spy.results) spy.results = [{ status: 'returned', result }];
 *     else spy.results.push({ status: 'returned', result });
 *     return result;
 *   } catch (error) {
 *     if (!spy.results) spy.results = [{ status: 'thrown', error }];
 *     else spy.results.push({ status: 'thrown', error });
 *     throw error;
 *   }
 * });
 */
export function proxyCallable<Fn extends Callable<never, unknown>>(fabric: CallableProxyFabric<Fn>): Fn {
  // eslint-disable-next-line prefer-const
  let cloned: Fn;
  const getTarget = (fn: Fn, newTarget: Fn | undefined) => (newTarget === cloned ? fn : newTarget);
  const call: CallableProxyFabricCall<Fn> = (fn, params, context, newTarget) => {
    newTarget = getTarget(fn, newTarget);
    if (newTarget) return Reflect.construct(fn, params, newTarget) as never;
    return Reflect.apply(fn, context, params) as never;
  };
  cloned = fabric(call, getTarget);
  return cloned;
}

/**
 * WARNING: does not hoist passed callable's fields
 * Clones any callable passed. Cloned function is anonymous.
 *
 * @example
 * declare fn: (...params: unknown[]) => unknown
 * const cloned = cloneCallable(fn);
 */
export function cloneCallable<Fn extends Callable<never, unknown>>(fn: Fn): InferCallableSign<Fn> {
  return proxyCallable(
    (call) =>
      function (this: unknown, ...params: unknown[]) {
        return call(fn as never, params as never, this, new.target as never);
      } as never,
  );
}

/**
 * Creates function wrapper that hoists fn's fields, name (if new name not provided),
 * but provides own implementation.
 *
 * @example
 * declare fn: {
 *   (...params: unknown[]): unknown;
 *   blah: 5;
 * };
 * const hoisted = hoistCallable(fn, (...params) => {
 *   log('called with:', ...params);
 *   const result = fn(...params);
 *   log('call result:', result);
 *   return result
 * })
 */
export function hoistCallable<Source extends Callable<never, unknown>, Hoisted extends Callable<never, unknown>>(
  source: Source,
  hoisted: Hoisted,
): Extend<Omit<Source, "">, Hoisted> {
  Object.setPrototypeOf(hoisted, source);
  if (Object.getOwnPropertyDescriptor(hoisted, "name")) {
    // @ts-expect-error(2704): there is name in fn
    delete hoisted.name;
  }
  return hoisted as never;
}

export type CallableWrapperFabric<Source extends Callable<never, unknown>, Wrapped extends Callable<never, unknown>> = (
  callSource: IfEquals<
    InferCallableSign<Source>,
    InferCallableSign<Wrapped>,
    (() => InferCallable<Source>["Result"]) &
      ((params: InferCallable<Source>["Params"], context: InferMethod<Source>["Context"]) => InferCallable<Source>["Result"]),
    (params: InferCallable<Source>["Params"], context: InferMethod<Source>["Context"]) => InferCallable<Source>["Result"]
  >,
  getTarget: () => Wrapped | undefined,
  getContext: () => InferMethod<Source>["Context"],
) => Wrapped;
/**
 * Wraps any callable, hoists {@link source} fields.
 *
 * @example
 * const logWrapper = <Fn extends Callable<never, unknown>>(fn: Fn) => wrapCallable(fn, callFn => function (this, ...params) => {
 *   log('called with:', ...params);
 *   const result = callFn();
 *   log('call result:', result);
 *   return result;
 * });
 * const wrapped = logWrapper((a: number, b: string) => `test-${a}-${b}`);
 * wrapped(1, '2');
 * // called with: 1 2
 * // call result: test-1-2
 */
export function wrapCallable<Source extends Callable<never, unknown>, Wrapped extends Callable<never, unknown>>(
  source: Source,
  wrappedFabric: CallableWrapperFabric<Source, Wrapped>,
  name?: string,
): Extend<Omit<Source, "">, Wrapped> {
  return nameCallable(
    name ?? source.name,
    proxyCallable((call, getTarget) => {
      let current: { params: InferCallable<Wrapped>["Params"]; context: InferMethod<Wrapped>["Context"]; target: Wrapped | undefined } | undefined;
      const wrapped = hoistCallable(
        source,
        wrappedFabric(
          // @ts-expect-error - too complicated types
          (params, context) => call(source, params ?? current!.params, context ?? current!.context, current!.target),
          () => getTarget(source as never, current!.target as never) as never,
          () => current!.context,
        ),
      );
      return hoistCallable(wrapped, function (this: unknown, ...params: unknown[]) {
        const prev = current;
        current = { params: params as never, context: this, target: new.target as never };
        try {
          return call(wrapped, params as never, this, new.target as never);
        } finally {
          current = prev;
        }
      }) as never;
    }),
  );
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
export function liftContext<Fn extends Functor<[never, ...never], unknown>>(fn: Fn) {
  type FnInferred = InferFunctor<Fn>;
  type Params = TupleUnshift<FnInferred["Params"]>;
  return wrapCallable<Fn, Method<Params[0], Params[1], FnInferred["Result"]>>(fn, (callFn, _, getContext) => (...params) => {
    return callFn([getContext(), ...params] as never, null);
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
  return Object.assign(hoistCallable(fn, cloneCallable(fn)), { curried: fn }) as never;
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
  reducer: (accumulated: Result, value: Value, index: number, reduced: (result: Result) => never) => Result,
  initial: Result,
): Result {
  try {
    const iterator = values[Symbol.iterator]();
    let results = iterator.next();
    let accumulated: Result = initial;
    let index = 0;
    while (!results.done) {
      accumulated = reducer(accumulated, results.value, index, (result) => {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw { [reducedSymbol]: result };
      });
      index += 1;
      results = iterator.next();
    }
    return accumulated;
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
