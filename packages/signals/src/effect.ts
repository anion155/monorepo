import { defineToStringTag } from "@anion155/shared";

import { context, depends } from "./internals";
import { Signal } from "./signal";
import type { SignalDependent, SignalListener } from "./types";

export type EffectCleanup = { (): void } | void;
export type EffectCallback = { (): EffectCleanup };

export interface SignalEffect extends SignalDependent {}
/**
 * Effect signal, runs effect every time value it's subscribed to is changed.
 *
 * @example
 * const server = new SignalState('https://example-chat/room-2');
 * const effect = new SignalEffect(() => {
 *   const connection = connect(server.value);
 *   return () => {
 *     connection.disconnect();
 *   };
 * });
 */
export class SignalEffect extends Signal implements SignalListener {
  #callback: EffectCallback;
  #cleanup: EffectCleanup = undefined;

  constructor(cb: EffectCallback) {
    super();
    depends.dependencies.stamp(this);
    DisposableStack.stamper.get(this).append(() => this.#cleanup?.());
    this.#callback = cb;
    this.invalidate();
  }

  invalidate() {
    this.#cleanup?.();
    using _subscription = context.setupSubscriptionContext(this);
    this.#cleanup = this.#callback();
  }
}
defineToStringTag(SignalEffect);
