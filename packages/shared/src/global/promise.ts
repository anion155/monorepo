import { noop } from "../functional";
import { defineMethod } from "../object";
import { TimeoutError } from "../promise";

declare global {
  interface PromiseConstructor {
    /** Returns promise that never resolved ot rejected */
    never(): Promise<never>;
  }
}
defineMethod(Promise, "never", function never() {
  return new Promise<never>(noop);
});

declare global {
  interface PromiseConstructor {
    /** Returns promise resolved on timeout */
    delay(ms: number): Promise<void>;
  }
}
defineMethod(Promise, "delay", function delay(ms) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
});

declare global {
  interface PromiseConstructor {
    /** Returns promise rejected on timeout with {@link TimeoutError} */
    timeout(ms: number): Promise<never>;
  }
}
defineMethod(Promise, "timeout", function timeout(ms) {
  return new Promise<never>((_, reject) => setTimeout(() => reject(new TimeoutError()), ms));
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Promise<T> {
    /** Creates signal that will be aborted on promise rejection */
    signal(): AbortSignal;
  }
}
defineMethod(Promise.prototype, "signal", function signal() {
  const controller = new AbortController();
  this.then(noop, (reason) => controller.abort(reason));
  return controller.signal;
});

export {};
