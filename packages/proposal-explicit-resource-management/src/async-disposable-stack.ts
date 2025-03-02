import "./global-symbols";

import { SuppressedError } from "./suppressed-error";

export interface AsyncDisposableStack {
  readonly [Symbol.toStringTag]: string;
}
export class AsyncDisposableStack {
  #stack: Array<() => PromiseLike<void>>;
  declare readonly disposed: boolean;

  constructor() {
    this.#stack = [];
    Object.defineProperty(this, "disposed", { value: false, writable: false, configurable: true });
  }

  use<T extends AsyncDisposable | Disposable | null | undefined>(value: T): T {
    if (this.disposed) throw new ReferenceError("AsyncDisposableStack already disposed");
    if (value === null || value === undefined) {
      this.#stack.push(async () => {});
      return value;
    }
    if (Symbol.asyncDispose in value && typeof value[Symbol.asyncDispose] === "function") {
      this.#stack.push(() => value[Symbol.asyncDispose]());
      return value;
    }
    if (Symbol.dispose in value && typeof value[Symbol.dispose] === "function") {
      this.#stack.push(() => Promise.resolve(value[Symbol.dispose]()));
      return value;
    }
    const dispose = Symbol.asyncDispose in value ? value[Symbol.asyncDispose] : value[Symbol.dispose];
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new TypeError(`${dispose} is not a function`);
  }
  defer(onDisposeAsync: () => void | PromiseLike<void>): void {
    if (this.disposed) throw new ReferenceError("AsyncDisposableStack already disposed");
    this.#stack.push(async () => onDisposeAsync());
  }
  adopt<T>(value: T, onDisposeAsync: (value: T) => void | PromiseLike<void>): T {
    if (this.disposed) throw new ReferenceError("AsyncDisposableStack already disposed");
    this.#stack.push(async () => onDisposeAsync(value));
    return value;
  }

  move(): AsyncDisposableStack {
    if (this.disposed) throw new ReferenceError("AsyncDisposableStack already disposed");
    const other = new AsyncDisposableStack();
    other.#stack = this.#stack;
    this.#stack = [];
    Object.defineProperty(this, "disposed", { value: true, writable: false, configurable: true });
    return other;
  }

  async disposeAsync(): Promise<void> {
    if (this.disposed) return;
    Object.defineProperty(this, "disposed", { value: true, writable: false, configurable: true });
    let error: unknown = null;
    while (this.#stack.length) {
      try {
        await this.#stack.pop()!.call(null);
      } catch (currentError) {
        error = error ? new SuppressedError(currentError, error) : currentError;
      }
    }
    this.#stack = [];
    // eslint-disable-next-line @typescript-eslint/only-throw-error -- it's an error
    if (error) throw error;
  }
  [Symbol.asyncDispose](): Promise<void> {
    return this.disposeAsync();
  }
}
Object.defineProperty(AsyncDisposableStack.prototype, Symbol.toStringTag, {
  value: "AsyncDisposableStack",
  writable: false,
  enumerable: false,
  configurable: true,
});
