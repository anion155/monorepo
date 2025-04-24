import { useStableCallback } from "../../use-stable-callback";
import type { SetStateDispatcher } from "../types";

/** Implementation of react's state dispatcher. */
export function useSetStateDispatcher<T>(get: () => T, set: (value: T) => void): SetStateDispatcher<T> {
  return useStableCallback<SetStateDispatcher<T>>((nextOrModifier) => {
    const next = nextOrModifier instanceof Function ? nextOrModifier(get()) : nextOrModifier;
    set(next);
  });
}
