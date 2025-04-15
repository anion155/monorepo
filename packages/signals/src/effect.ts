import { defineToStringTag } from "@anion155/shared";

import { context, depends, SignalDependent, SignalListener } from "./internals/internals";
import { Signal } from "./signal";

export type EffectCleanup = { (): void } | void;
export type EffectCallback = { (): EffectCleanup };

export interface SignalEffect extends SignalDependent {}
export class SignalEffect extends Signal implements SignalListener {
  #callback: EffectCallback;
  #cleanup: EffectCleanup = undefined;

  constructor(cb: EffectCallback) {
    super();
    depends.dependencies.stamp(this);
    DisposableStack.stamper.get(this).append(() => this.#cleanup?.());
    this.#callback = cb;
    this[Symbol.invalidate]();
  }

  [Symbol.invalidate]() {
    this.#cleanup?.();
    using _subscription = context.setupSubscriptionContext(this);
    this.#cleanup = this.#callback();
  }
}
defineToStringTag(SignalEffect);
