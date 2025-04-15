import { useConst, useRenderEffect } from "@anion155/shared/react";
import { useSyncExternalStore } from "react";

import { depends, SignalValue } from "../internals/internals";
import { createSignalsStore } from "./utils";

export function useSignalValue<Value>(signal: SignalValue<Value>) {
  const store = useConst(createSignalsStore);
  useRenderEffect(() => depends.bind(store.effect, signal), [signal, store.effect]);
  return useSyncExternalStore(store.subscribe, () => signal.peak());
}
