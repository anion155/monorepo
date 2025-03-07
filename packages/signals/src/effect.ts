import "./internals/symbol";

import { Dependent } from "@anion155/shared";

import { asynchronizeInvalidate } from "./internals/asynchronize-invalidate";
import { context, depends } from "./internals/internals";
import { SignalListener } from "./internals/types";
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
    depends.dependencies.stamp(this);
    DisposableStack.stamper.get(this).append(() => this.#cleanup?.());
    this.#callback = cb;

    if (!sync) {
      const asyncInvalidate = asynchronizeInvalidate(this);
      DisposableStack.stamper.get(this).append(() => asyncInvalidate.cancel());
      asyncInvalidate.sync();
    } else {
      this[Symbol.invalidate]();
    }
  }

  [Symbol.invalidate]() {
    this.#cleanup?.();
    using _subscription = context.setupSubscriptionContext(this);
    this.#cleanup = this.#callback();
  }
}
