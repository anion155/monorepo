import { useConst, useRenderEffect } from "@anion155/shared/react";
import { useSyncExternalStore } from "react";

import { internals, SignalReadonlyValue } from "../internals";
import { createSignalsStore } from "./utils";

export function useSignalValue<Value>(signal: SignalReadonlyValue<Value>) {
  const store = useConst(createSignalsStore);
  useRenderEffect(() => internals.bind(store.effect, signal), [signal, store.effect]);
  return useSyncExternalStore(
    store.subscribe,
    () => signal.peak(),
    () => signal.peak()
  );
}
