import { defineToStringTag } from "@anion155/shared";

import { EffectCallback, SignalEffect } from "./effect";

const initialized = new WeakSet<SignalEffectAsync>();
export class SignalEffectAsync extends SignalEffect {
  constructor(cb: EffectCallback) {
    super(cb);
    DisposableStack.stamper.get(this).append(() => this.#state?.[1]());
    initialized.add(this);
    this[Symbol.invalidate](true);
  }

  #state: [Promise<void>, abort: () => void] | undefined;
  [Symbol.invalidate](sync?: boolean) {
    if (!initialized.has(this)) return;
    if (sync) {
      this.#state?.[1]();
      super[Symbol.invalidate]();
      return;
    }
    if (this.#state) return;
    const controller = new AbortController();
    const promise = Promise.resolve().then(() => {
      if (controller.signal.aborted) return;
      this.#state = undefined;
      super[Symbol.invalidate]();
    });
    this.#state = [promise, () => controller.abort()];
  }
}
defineToStringTag(SignalEffectAsync);
