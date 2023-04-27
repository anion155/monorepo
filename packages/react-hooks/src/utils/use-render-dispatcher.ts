import type { DependencyList } from "react";
import { useRef } from "react";

import { compareProps } from "./compare-props";

export function useRenderDispatcher<S>(
  deps: DependencyList,
  onChange: (state: S | undefined, prevDeps: DependencyList | undefined) => S
): S {
  const prevRef = useRef<[S, DependencyList]>();
  const prev = prevRef.current;
  let state: S;

  if (!prev) {
    state = onChange(undefined, undefined);
    prevRef.current = [state, deps];
  } else if (!compareProps(prev[1], deps)) {
    state = onChange(...prev);
    prevRef.current = [state, deps];
  } else {
    [state] = prev;
  }

  return state;
}
