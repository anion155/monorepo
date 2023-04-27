import { useCallback, useRef } from "react";

import { assert } from "./utils/index";

export function useStableCallback<As extends unknown[], R>(
  cb: (...args: As) => R
): (...args: As) => R {
  const store = useRef(cb);
  store.current = cb;

  const constCb = useCallback((...args: As) => {
    assert(store.current, "DeveloperError: cb must be defined");
    return store.current(...args);
  }, []);

  return constCb;
}

/** @deprecated Use {@link useStableCallback} */
export const useConstCallback = useStableCallback;
