import { Dependent } from "@anion155/shared";

import { internals, SignalListener } from "./internals";
import { Signal } from "./signal";

export type EffectCleanup = { (): void } | void;
export type EffectCallback = { (): EffectCleanup };

export interface SignalEffect extends Dependent {}
export class SignalEffect extends Signal implements SignalListener {
  #callback: EffectCallback;
  #cleanup: EffectCleanup = undefined;

  constructor(
    cb: EffectCallback,
    readonly sync: boolean = false,
  ) {
    super();
    internals.dependencies.stamp(this);
    DisposableStack.stamper.get(this).append(() => this.#cleanup?.());
    this.#callback = cb;

    if (!sync) {
      const asyncInvalidate = internals.asynchronizeInvalidate(this);
      DisposableStack.stamper.get(this).append(() => asyncInvalidate.cancel());
      asyncInvalidate.sync();
    } else {
      this[internals.invalidate]();
    }
  }

  [internals.invalidate]() {
    this.#cleanup?.();
    using _subscription = internals.setupSubscriptionContext(this);
    this.#cleanup = this.#callback();
  }
}
