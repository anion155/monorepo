import type { SetStateDispatcher } from "@anion155/react-hooks";
import {
  useConst,
  useRenderEffect,
  useSetStateDispatcher,
} from "@anion155/react-hooks";
import { useSyncExternalStore } from "use-sync-external-store/shim";

import type { ReactRxStore, ReactRxStoreInput } from "./utils";
import { createReactRxStore } from "./utils";

export function useRxStore<T>(initial: ReactRxStoreInput<T>): ReactRxStore<T> {
  const store = useConst(() => createReactRxStore(initial));
  useRenderEffect(() => {
    if (store === initial) return undefined;
    return () => store.complete();
  }, [store]);

  return store;
}

export function useRxStoreValue<T>(store: ReactRxStore<T>): T {
  return useSyncExternalStore(store.reactSubscription, store.getValue);
}

export function useRxStoreDispatcher<T>(
  store: ReactRxStore<T>
): SetStateDispatcher<T> {
  return useSetStateDispatcher(
    () => store.getValue(),
    (value) => store.next(value)
  );
}
