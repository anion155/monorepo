import type { DependencyList, EffectCallback } from "react";
import { useEffect } from "react";

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
  useEffect(() => destructor, [destructor]);
}
