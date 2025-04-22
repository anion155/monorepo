import { defineToStringTag } from "@anion155/shared";

import type { EffectCallback } from "./effect";
import { SignalEffect } from "./effect";

const initialized = new WeakSet<SignalEffectAsync>();
/**
 * Effect signal, runs effect every time value it's subscribed to is changed.
 * Batching changes until promise resolved.
 *
 * @example
 * const server = new SignalState('https://example-chat/room-2');
 * const effect = new SignalEffectAsync(() => {
 *   const connection = connect(server.value);
 *   return () => {
 *     connection.disconnect();
 *   };
 * });
 */
export class SignalEffectAsync extends SignalEffect {
  constructor(cb: EffectCallback) {
    super(cb);
    DisposableStack.stamper.get(this).append(() => this.#state?.[1]());
    initialized.add(this);
    this.invalidate(true);
  }

  #state: [Promise<void>, abort: () => void] | undefined;
  invalidate(sync?: boolean) {
    if (!initialized.has(this)) return;
    if (sync) {
      this.#state?.[1]();
      super.invalidate();
      return;
    }
    if (this.#state) return;
    const controller = new AbortController();
    const promise = Promise.resolve().then(() => {
      if (controller.signal.aborted) return;
      this.#state = undefined;
      super.invalidate();
    });
    this.#state = [promise, () => controller.abort()];
  }
}
defineToStringTag(SignalEffectAsync);
