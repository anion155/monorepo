import "./symbols";

import type { Disposable } from "./disposable";
import { SuppressedError } from "./suppressed-error";

export interface DisposableStack {
  readonly [Symbol.toStringTag]: string;
}
export class DisposableStack {
  #stack: Array<() => void>;
  declare readonly disposed: boolean;

  constructor() {
    this.#stack = [];
    Object.defineProperty(this, "disposed", { value: false, writable: false, configurable: true });
  }

  use<T extends Disposable | null | undefined>(value: T): T {
    if (this.disposed) throw new ReferenceError("DisposableStack already disposed");
    if (value === null || value === undefined) return value;
    if (Symbol.dispose in value && typeof value[Symbol.dispose] === "function") {
      this.#stack.push(() => value[Symbol.dispose]());
      return value;
    }

    throw new TypeError(`[Symbol.dispose] is not a function`);
  }
  defer(onDispose: () => void): void {
    if (this.disposed) throw new ReferenceError("DisposableStack already disposed");
    this.#stack.push(onDispose);
  }
  adopt<T>(value: T, onDispose: (value: T) => void): T {
    if (this.disposed) throw new ReferenceError("DisposableStack already disposed");
    this.#stack.push(() => onDispose(value));
    return value;
  }

  move(): DisposableStack {
    if (this.disposed) throw new ReferenceError("DisposableStack already disposed");
    const other = new DisposableStack();
    other.#stack = this.#stack;
    this.#stack = [];
    Object.defineProperty(this, "disposed", { value: true, writable: false, configurable: true });
    return other;
  }

  dispose(): void {
    if (this.disposed) return;
    Object.defineProperty(this, "disposed", { value: true, writable: false, configurable: true });
    let error: unknown = null;
    while (this.#stack.length) {
      try {
        this.#stack.pop()!.call(null);
      } catch (currentError) {
        error = error ? new SuppressedError(currentError, error) : currentError;
      }
    }
    this.#stack = [];
    if (error) throw error;
  }
  [Symbol.dispose](): void {
    this.dispose();
  }
}
Object.defineProperty(DisposableStack.prototype, Symbol.toStringTag, {
  value: "DisposableStack",
  writable: false,
  enumerable: false,
  configurable: true,
});
