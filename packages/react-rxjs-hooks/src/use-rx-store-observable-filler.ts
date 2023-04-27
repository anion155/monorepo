import type { DependencyList } from "react";
import { useMemo } from "react";
import type { ObservableInput } from "rxjs";
import { from } from "rxjs";

import { useRxStore } from "./use-rx-store";
import { useRxSubscription } from "./use-rx-subscription";
import type { ReactRxStore, ReactRxStoreInput } from "./utils";

export function useRxStoreObservableFiller<T>(
  sourceFabric: () => ObservableInput<T>,
  deps: DependencyList,
  storeInitial?: ReactRxStoreInput<T | undefined>
): ReactRxStore<T | undefined> {
  // eslint-disable-next-line react-hooks/exhaustive-deps -- used in conjunction with deps
  const memoizedFabric = useMemo(() => sourceFabric, deps);

  const store = useRxStore(storeInitial);
  useRxSubscription(
    () => from(memoizedFabric()).subscribe(store),
    [memoizedFabric, store]
  );

  return store;
}
