import { useConst, useRenderEffect } from "@anion155/shared/react";
import { useSyncExternalStore } from "react";

import { depends } from "../internals";
import type { SignalReadonly } from "../signal-readonly";
import type { SignalDependency } from "../types";
import { createSignalsStore } from "./utils";

export function useSignalValue<Value>(signal: SignalDependency & SignalReadonly<Value>) {
  const store = useConst(createSignalsStore);
  useRenderEffect(() => depends.bind(store.effect, signal), [signal, store.effect]);
  return useSyncExternalStore(store.subscribe, () => signal.snapshot(store.effect));
}
