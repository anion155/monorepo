import { useRenderEffect } from "@anion155/react-hooks";
import type { DependencyList } from "react";
import { useMemo } from "react";
import type { ObservableInput } from "rxjs";
import { Observable, Subscription, from } from "rxjs";

export function useRxSubscription(
  fabric: () => Subscription | ObservableInput<unknown>,
  deps: DependencyList
): void {
  // eslint-disable-next-line react-hooks/exhaustive-deps -- usage of deps
  const memoizedFabric = useMemo(() => fabric, deps);
  const subscription = useMemo(() => {
    const source = memoizedFabric();
    if (source instanceof Subscription) return source;
    if (source instanceof Observable) return source.subscribe();
    return from(source).subscribe();
  }, [memoizedFabric]);

  useRenderEffect(() => () => subscription.unsubscribe(), [subscription]);
}
