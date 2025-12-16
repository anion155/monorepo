import "../global/functions";

import { useCallback, useRef } from "react";

/**
 * Creates stable callback that would call latest version of passed {@link fn} function.
 *
 * @example
 *  const useWrapperLogic = (onEvent) => {
 *    const stableOnEvent = useStableCallback(onEvent);
 *    useEffect(() => {
 *      stableOnEvent(event);
 *    }, [stableOnEvent]);
 *  };
 *
 * @example
 *  const useStateProxy = (value, onChange) => {
 *    const setValue = useStableCallback((modifier) => {
 *      onChange(modifier(value)); // will have access to latest value, yet setValue function never gonna change
 *    });
 *    return [value, setValue] as const;
 *  };
 */
export function useStableCallback<Fn extends Functor<never, unknown>>(fn: Fn): InferFunctorSign<Fn>;
export function useStableCallback<Fn extends Functor<never, unknown>>(
  fn: Fn | undefined,
): Fn extends Functor<infer Params, infer Result> ? Functor<Params, Result | undefined> : never;
export function useStableCallback(fn: Functor<never, unknown> | undefined) {
  const store = useRef(fn);
  store.current = fn;
  return useCallback<Functor<never, unknown>>((...params) => {
    return store.current?.(...params);
  }, []);
}
