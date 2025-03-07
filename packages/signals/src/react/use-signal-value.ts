import { useConst, useRenderEffect } from "@anion155/shared/react";
import { useSyncExternalStore } from "react";

import { depends } from "../internals/internals";
import { SignalReadonlyValue } from "../internals/types";
import { createSignalsStore } from "./utils";

export function useSignalValue<Value>(signal: SignalReadonlyValue<Value>) {
  const store = useConst(createSignalsStore);
  useRenderEffect(() => depends.bind(store.effect, signal), [signal, store.effect]);
  return useSyncExternalStore(
    store.subscribe,
    () => signal.peak(),
    () => signal.peak(),
  );
}
