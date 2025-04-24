import { incrementGenerator } from "@anion155/shared";

import { SignalEffect, SignalEffectAsync } from "../../index";

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
export function createSignalsStore(sync: boolean = true): SignalsStore {
  let scheduleRender: { (): void } | undefined;
  const version = incrementGenerator();
  const effectCb = () => {
    version.next();
    scheduleRender?.();
  };
  const effect = sync ? new SignalEffect(effectCb) : new SignalEffectAsync(effectCb);
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
