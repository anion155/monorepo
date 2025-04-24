import type { DependencyList, EffectCallback } from "react";
import { useEffect } from "react";

import { useStableCallback } from "./use-stable-callback";
import { useRenderDispatcher } from "./utils/use-render-dispatcher";

/**
 * Call effect inline whenever deps are changed.
 * {@link effect} can return destructor function, that would be called before next effect or unmount.
 */
export function useRenderEffect(effect: EffectCallback, deps: DependencyList): void {
  const destructor = useRenderDispatcher(deps, (cleanup: ReturnType<EffectCallback>) => {
    cleanup?.();
    return effect();
  });
  const lastDestructor = useStableCallback(destructor ?? undefined);
  useEffect(() => () => lastDestructor(), [lastDestructor]);
}
