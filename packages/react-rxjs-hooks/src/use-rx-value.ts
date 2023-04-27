import type { DependencyList } from "react";
import type { BehaviorSubject, ObservableInput } from "rxjs";

import { useRxStoreValue } from "./use-rx-store";
import { useRxStoreObservableFiller } from "./use-rx-store-observable-filler";

export function useRxValue<T>(
  sourceFabric: () => BehaviorSubject<T>,
  deps: DependencyList
): T;
export function useRxValue<T>(
  sourceFabric: () => ObservableInput<T>,
  deps: DependencyList
): T | undefined;
export function useRxValue<T>(
  sourceFabric: () => ObservableInput<T>,
  deps: DependencyList
): T | undefined {
  const store = useRxStoreObservableFiller(sourceFabric, deps);
  const value = useRxStoreValue(store);

  return value;
}
