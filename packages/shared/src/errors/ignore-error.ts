import { curryHelper, identity, wrapFunctor } from "../functional";
import { isError } from "../is";
import { isPromise } from "../promise";

export function ignoreError<SubError extends Error, Result>(Class: { new (...params: never): SubError }, result: Result) {
  const isIgnoredError = isError.create(Class);
  return curryHelper(
    <Fn extends Method<never, never, unknown>>(fn: Fn): Fn =>
      wrapFunctor(fn, function (this, ...params) {
        try {
          const result = fn.call(this, ...params);
          if (isPromise(result)) {
            return result.then(identity, (error) => {
              if (isIgnoredError(error)) return result;
              throw error;
            });
          }
          return result;
        } catch (error) {
          if (isIgnoredError(error)) return result;
          throw error;
        }
      } as Fn),
  );
}
