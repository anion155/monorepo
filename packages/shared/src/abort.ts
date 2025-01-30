import { createErrorClass } from "./errors";
import { noop } from "./functional";
import { defineMethod } from "./object";

export class AbortError extends createErrorClass("AbortError", "this operation was aborted") {}

declare global {
  interface AbortSignal {
    /**
     * Call {@link onAborted} when this signal will be aborted
     * If it was already aborted {@link onAborted} is called immediately.
     */
    handle(onAborted: (reason?: unknown) => void): void;
  }
}
defineMethod(AbortSignal.prototype, "handle", function handle(onAborted) {
  if (this.aborted) {
    onAborted(this.reason);
  } else {
    this.addEventListener("abort", () => onAborted(this.reason));
  }
});

declare global {
  interface AbortSignal {
    /** Creates promise that will be rejected on signal abortion */
    promise(): Promise<void>;
  }
}
defineMethod(AbortSignal.prototype, "promise", function promise() {
  return new Promise((_, reject) => this.handle(reject));
});

declare global {
  interface AbortController {
    /** Binds this controller to signal */
    bindToSignal(signal: AbortSignal | null | undefined, reason?: unknown): this;
  }
}
defineMethod(AbortController.prototype, "bindToSignal", function bindToSignal(this: AbortController, signal, reason) {
  signal?.handle(() => this.abort(reason ?? signal.reason));
  return this;
});

declare global {
  interface AbortController {
    /** Binds this controller to promise */
    bindToPromise(promise: Promise<unknown> | null | undefined): this;
  }
}
defineMethod(AbortController.prototype, "bindToPromise", function bindToPromise(this: AbortController, promise) {
  promise?.then(noop, (reason) => this.abort(reason));
  return this;
});
