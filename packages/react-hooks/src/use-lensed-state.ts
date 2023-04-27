import type { SetStateDispatcher } from "./use-set-state-dispatcher";
import { useStableCallback } from "./use-stable-callback";

export function useLensedState<T, U>(
  state: readonly [T, SetStateDispatcher<T>],
  getter: (state: T) => U,
  setter: (value: U, state: T) => T
): [U, SetStateDispatcher<U>] {
  const value: U = getter(state[0]);
  const setValue = useStableCallback<SetStateDispatcher<U>>(
    (nextOrModifier) => {
      state[1]((current) => {
        const next =
          nextOrModifier instanceof Function
            ? nextOrModifier(getter(current))
            : nextOrModifier;
        return setter(next, current);
      });
    }
  );

  return [value, setValue];
}
