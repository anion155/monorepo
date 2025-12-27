import "./symbols";

import type { AsyncDisposableStack as AsyncDisposableStackPolyfill } from "./async-disposable-stack";
import type { DisposableStack as DisposableStackPolyfill } from "./disposable-stack";
import type { SuppressedError as SuppressedErrorPolyfill } from "./suppressed-error";

declare global {
  interface Disposable {
    [Symbol.dispose](): void;
  }

  interface AsyncDisposable {
    [Symbol.asyncDispose](): void;
  }

  interface SuppressedError extends SuppressedErrorPolyfill {}
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - can't disable
  var SuppressedError: typeof SuppressedErrorPolyfill;

  interface DisposableStack extends DisposableStackPolyfill {}
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - can't disable
  var DisposableStack: typeof DisposableStackPolyfill;

  interface AsyncDisposableStack extends AsyncDisposableStackPolyfill {}
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - can't disable
  var AsyncDisposableStack: typeof AsyncDisposableStackPolyfill;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface IteratorObject<T, TReturn, TNext> {
    [Symbol.dispose](): void;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface AsyncIteratorObject<T, TReturn, TNext> {
    [Symbol.asyncDispose](): Promise<void>;
  }
}

export {};
