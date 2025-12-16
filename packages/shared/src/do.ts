import { isDisposable } from "./disposable";

/** Throws {@link Error} with {@link message} */
export function doThrow(message?: string): never;
/** Throws {@link error} */
export function doThrow(error: unknown): never;
export function doThrow(error: unknown): never {
  throw typeof error === "string" ? new Error(error) : error;
}
/** Return {@link Promise} rejected with {@link Error} with {@link message} */
function doThrowAsync(message?: string): Promise<never>;
/** Return {@link Promise} rejected with {@link Error} */
function doThrowAsync(error: unknown): Promise<never>;
function doThrowAsync(error: unknown): Promise<never> {
  // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
  return Promise.reject(typeof error === "string" ? new Error(error) : error);
}
doThrow.async = doThrowAsync;

/** Calls {@link fn}, returns it's result */
export function doRun<Result>(fn: () => Result): Result;
/** Calls {@link fn}, returns it's result, and if it throws an error calls {@link onError} */
export function doRun<Result1, Result2>(fn: () => Result1, onError: (error: unknown) => Result2): Result1 | Result2;
export function doRun(fn: () => unknown, onError: (error: unknown) => unknown = doThrow) {
  try {
    const result = fn();
    return result;
  } catch (error) {
    return onError(error);
  }
}
/** Calls {@link fn}, returns it's result */
function doRunAsync<Result>(fn: () => Promise<Result>): Promise<Awaited<Result>>;
/** Calls {@link fn}, returns it's result, and if it throws an error calls {@link onError} */
function doRunAsync<Result1, Result2>(fn: () => Promise<Result1>, onError: (error: unknown) => Result2): Promise<Awaited<Result1> | Awaited<Result2>>;
async function doRunAsync(fn: () => Promise<unknown>, onError: (error: unknown) => unknown = doThrow) {
  try {
    const result = await fn();
    return result;
  } catch (error) {
    return onError(error);
  }
}
doRun.async = doRunAsync;

/** Calls {@link fn} with {@link value} as first parameter, returns void */
export function doApply<Value>(value: Value, fn: (value: Value) => unknown) {
  fn(value);
}
doApply.async = async function doApplyAsync<Value>(value: Value, fn: (value: Value) => Promise<unknown>) {
  await fn(value);
};

/**
 * Calls {@link fn} with all arguments, returns it's result,
 * every {@link Disposable} argument will be disposed after execution
 *
 * @example
 *  declare const openDescriptor: (path: string) => Descriptor & Disposable;
 *  doWith(openDescriptor(), descriptor => ...);
 *  // descriptor is closed
 */
export function doWith<Args extends unknown[], Result>(...doArgs: [...args: Args, fn: (...args: Args) => Result]): Result {
  const fn = doArgs.pop() as (...args: Args) => Result;
  const args = doArgs as never as Args;
  const resources = new DisposableStack();
  resources.append(...args.filter(isDisposable));
  return doRun(
    () => {
      const result = fn(...args);
      resources.dispose();
      return result;
    },
    (error) => SuppressedError.suppress(error, () => resources.dispose()),
  );
}
/**
 * Calls {@link fn} with all arguments, returns it's result,
 * every {@link Disposable} or {@link AsyncDisposable} argument will be disposed after execution
 *
 * @example
 *  declare const openDescriptor: (path: string) => Descriptor & Disposable;
 *  doWith.async(openDescriptor(), descriptor => ...);
 *  // descriptor is closed
 */
doWith.async = function doWithAsync<Args extends unknown[], Result>(
  ...doArgs: [...args: Args, fn: (...args: Args) => Promise<Result>]
): Promise<Result> {
  const fn = doArgs.pop() as (...args: Args) => Result;
  const args = doArgs as never as Args;
  const resources = new AsyncDisposableStack();
  resources.append(...args.filter((arg): arg is Disposable | AsyncDisposable => isDisposable(arg) || isDisposable.async(arg)));
  return doRun.async(
    async () => {
      const result = await fn(...args);
      await resources.disposeAsync();
      return result;
    },
    (error) => SuppressedError.suppressAsync(error, () => resources.disposeAsync()),
  );
};
