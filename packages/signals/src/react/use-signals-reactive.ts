import { useConst } from "@anion155/shared/react";
import { useSyncExternalStore } from "react";

import { internals } from "../internals";
import { createSignalsStore } from "./utils";

/**
 * Hook that allows you to subscribe to values that was used during render call.
 *
 * @example
 * const state = signalState(5);
 * const Counter = () => {
 *   using signals = useSignalsReactive(); // sets up signals context, that would be cleaned up on render finish
 *   return (
 *     <div>
 *       <div>{state.get()}</div> // on first render will subscribe to state changes
 *       <button onPress={() => state.set(state.get() - 1)}>-</button>
 *       <button onPress={() => state.set(state.get() + 1)}>+</button>
 *     </div>
 *   );
 * };
 */
export function useSignalsReactive(sync: boolean = true) {
  const store = useConst(() => createSignalsStore(sync));
  useSyncExternalStore(store.subscribe, store.getVersion, store.getVersion);
  const { [Symbol.dispose]: dispose } = internals.setupSubscriptionContext(store.effect);
  return { effect: store.effect, [Symbol.dispose]: dispose };
}
