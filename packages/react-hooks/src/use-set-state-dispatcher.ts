import type { DependencyList } from "react";

import { useStableCallback } from "./use-stable-callback";

export type SetStateDispatcher<T> = (state: T | { (current: T): T }) => void;

export function useSetStateDispatcher<T>(
  get: () => T,
  set: (value: T) => void,
  /** @deprecated returned callback is stable now, so no need in `deps`  */
  _deps?: DependencyList
): SetStateDispatcher<T> {
  const dispatcher = useStableCallback<SetStateDispatcher<T>>(
    (nextOrModifier) => {
      const next =
        nextOrModifier instanceof Function
          ? nextOrModifier(get())
          : nextOrModifier;
      set(next);
    }
  );

  return dispatcher;
}
