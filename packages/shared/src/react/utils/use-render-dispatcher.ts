import type { DependencyList } from "react";
import { useRef } from "react";

import { compare } from "../../misc";

/**
 * Creates dispatcher that calls dispatcher when {@link deps} changes.
 *
 * @example
 *  const useRenderEffect = effect => {
 *    const destructor = useRenderDispatcher(deps, (cleanup: ReturnType<EffectCallback>) => {
 *      cleanup?.();
 *      return effect();
 *    });
 *  }
 */
export function useRenderDispatcher<S>(deps: DependencyList, onChange: (state: S | undefined, prevDeps: DependencyList | undefined) => S): S {
  const prevRef = useRef<[S, DependencyList] | undefined>(undefined);
  const prev = prevRef.current;
  let state: S;

  if (!prev) {
    state = onChange(undefined, undefined);
    prevRef.current = [state, deps];
  } else if (!compare(prev[1], deps, false)) {
    state = onChange(...prev);
    prevRef.current = [state, deps];
  } else {
    [state] = prev;
  }

  return state;
}
