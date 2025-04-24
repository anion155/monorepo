import type { State } from "./types";
import { useSetStateDispatcher } from "./utils/use-set-state-dispatcher";

/** Lensed react's state. */
export function useLensedState<T, U>(sourceState: State<T>, getter: (state: T) => U, setter: (value: U, state: T) => T): State<U> {
  const value: U = getter(sourceState[0]);
  const setValue = useSetStateDispatcher(
    () => getter(sourceState[0]),
    (next) => {
      sourceState[1]((current) => setter(next, current));
    },
  );

  return [value, setValue];
}
