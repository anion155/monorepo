import type { DependencyList, EffectCallback } from "react";
import { useRef, useEffect } from "react";

import { useRenderDispatcher } from "./utils";

export function useRenderEffect(
  effect: EffectCallback,
  deps: DependencyList
): void {
  const destructor = useRenderDispatcher(
    deps,
    (cleanup: ReturnType<EffectCallback>) => {
      cleanup?.();
      return effect();
    }
  );

  const lastDestructor = useRef<ReturnType<EffectCallback>>();
  lastDestructor.current = destructor;

  useEffect(() => lastDestructor.current, []);
}
