import { incrementGenerator } from "@anion155/shared";

import { SignalEffect } from "../../effect";

export type SignalsStore = {
  effect: SignalEffect;
  subscribe(onStoreChange: () => void): () => void;
  getVersion: () => number;
};

/**
 * Creates store compatible with useSyncExternalStore.
 *
 * @example
 * const store = createSignalsStore();
 * internals.bind(store.effect, dependency);
 */
export function createSignalsStore(sync?: boolean): SignalsStore {
  let scheduleRender: { (): void } | undefined;
  const version = incrementGenerator();
  const effect = new SignalEffect(() => {
    version.next();
    scheduleRender?.();
  }, sync);
  return {
    effect,
    subscribe(onStoreChange) {
      scheduleRender = onStoreChange;
      return () => {
        scheduleRender = undefined;
        effect.dispose();
      };
    },
    getVersion: () => version.current,
  };
}
