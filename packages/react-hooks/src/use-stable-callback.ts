import { useCallback, useRef } from "react";

import { assert } from "./utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- can't use `unknown` here
export function useStableCallback<F extends (...args: any[]) => any>(
  cb: (...args: Parameters<F>) => ReturnType<F>
): (...args: Parameters<F>) => ReturnType<F> {
  const store = useRef(cb);
  store.current = cb;

  const constCb = useCallback((...args: Parameters<F>) => {
    assert(store.current, "DeveloperError: cb must be defined");
    return store.current(...args);
  }, []);

  return constCb;
}

/** @deprecated Use {@link useStableCallback} */
export const useConstCallback: <As extends unknown[], R>(
  cb: (...args: As) => R
) => (...args: As) => R = useStableCallback as never;
