import { curryHelper, wrapCallable } from "../functional";
import { isError } from "../is";
import { isPromise } from "../promise";

/**
 * Utility that waits for function result, and on specific error swaps it to result.
 * Accepts both sync and async functions.
 *
 * @example
 * const main = ignoreError(DeveloperError, -1)((argv) => {
 *   if (Array.isArray(argv)) throw new DeveloperError('only array allowed');
 *   return 0;
 * });
 * main([]); // 0
 * main(5); // -1
 */
export function ignoreError<SubError extends Error, Result>(Class: { new (...params: never): SubError }, failsafe: Result) {
  const isIgnoredError = isError.create(Class);
  return curryHelper(<Fn extends Method<never, never, unknown>>(fn: Fn) =>
    wrapCallable<Fn, Fn>(
      fn,
      (call) =>
        function () {
          try {
            const result = call();
            if (isPromise(result)) {
              return result.catch((error) => {
                if (isIgnoredError(error)) return failsafe;
                throw error;
              });
            }
            return result;
          } catch (error) {
            if (isIgnoredError(error)) return failsafe;
            throw error;
          }
        } as Fn,
    ),
  );
}
