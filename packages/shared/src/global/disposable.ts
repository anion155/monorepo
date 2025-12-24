import { isDisposable } from "../disposable/is-disposable";
import { DeveloperError, never } from "../errors";
import { appendMethod, defineMethod, defineProperty } from "../object";
import { Stamper } from "../stamper";

declare global {
  interface DisposableStack {
    /** Throws {@link DeveloperError} if stack was already disposed */
    throwIfDisposed(): void;
  }
  interface AsyncDisposableStack {
    /** Throws {@link DeveloperError} if stack was already disposed */
    throwIfDisposed(): void;
  }
}
defineMethod(DisposableStack.prototype, "throwIfDisposed", function () {
  if (this.disposed) {
    throw new DeveloperError("trying to use disposed stack");
  }
});
defineMethod(AsyncDisposableStack.prototype, "throwIfDisposed", function () {
  if (this.disposed) {
    throw new DeveloperError("trying to use disposed stack");
  }
});

declare global {
  type DisposableStackArgument = Disposable | { (): void } | null | undefined;
  type AsyncDisposableStackArgument = DisposableStackArgument | AsyncDisposable | { (): Promise<void> };
}

declare global {
  interface DisposableStack {
    /** Append any kind of disposables */
    append(...disposables: Array<DisposableStackArgument>): this;
  }
  interface AsyncDisposableStack {
    /** Append any kind of disposables */
    append(...disposables: Array<AsyncDisposableStackArgument>): this;
  }
}
defineMethod(DisposableStack.prototype, "append", function append(this: DisposableStack, ...disposables) {
  disposables.forEach((disposable) => {
    if (isDisposable(disposable)) this.use(disposable);
    else if (typeof disposable === "function") this.defer(disposable);
  });
  return this;
});
defineMethod(AsyncDisposableStack.prototype, "append", function append(this: AsyncDisposableStack, ...disposables) {
  disposables.forEach((disposable) => {
    if (isDisposable(disposable) || isDisposable.async(disposable)) this.use(disposable);
    else if (typeof disposable === "function") this.defer(disposable);
  });
  return this;
});

declare global {
  interface DisposableStackConstructor {
    /** Create {@link DisposableStack} with prefilled disposables */
    create(...disposables: Array<DisposableStackArgument>): DisposableStack;
  }
  interface AsyncDisposableStackConstructor {
    /** Create {@link AsyncDisposableStack} with prefilled disposables */
    create(...disposables: Array<AsyncDisposableStackArgument>): AsyncDisposableStack;
  }
}
defineMethod(DisposableStack, "create", function create(...disposables) {
  const stack = new DisposableStack();
  stack.append(...disposables);
  return stack;
});
defineMethod(AsyncDisposableStack, "create", function create(...disposables) {
  const stack = new AsyncDisposableStack();
  stack.append(...disposables);
  return stack;
});

declare global {
  interface DisposableStackConstructor {
    /**
     * Creates transaction routine that creates {@link DisposableStack},
     * passes it to {@link fn} and returns new stack as result of [move]{@link DisposableStack#move} call.
     * Could accept {@link stack} and in that case will use it during transaction routine.
     */
    transaction(fn: (stack: DisposableStack) => void, stack?: DisposableStack): DisposableStack;
  }
  interface AsyncDisposableStackConstructor {
    /**
     * Creates asynchronous transaction routine that creates {@link AsyncDisposableStack},
     * passes it to {@link fn} and returns new stack as result of [move]{@link AsyncDisposableStack#move} call.
     * Could accept {@link stack} and in that case will use it during transaction routine.
     */
    transaction(fn: (stack: AsyncDisposableStack) => Promise<void> | void, stack?: AsyncDisposableStack): Promise<AsyncDisposableStack>;
  }
}
defineMethod(DisposableStack, "transaction", function transaction(fn, passedStack) {
  const stack = passedStack ?? new DisposableStack();
  try {
    fn(stack);
    return stack.move();
  } catch (error) {
    SuppressedError.suppress(error, () => stack.dispose());
  }
});
defineMethod(AsyncDisposableStack, "transaction", async function transaction(fn, passedStack) {
  const stack = passedStack ?? new AsyncDisposableStack();
  try {
    await fn(stack);
    return stack.move();
  } catch (error) {
    await SuppressedError.suppressAsync(error, () => stack.disposeAsync());
    never();
  }
});

declare global {
  interface DisposableStackConstructor {
    /** {@link Stamper} that stamps {@link DisposableStack} into {@link Disposable} object */
    readonly stamper: Stamper<Disposable, DisposableStack>;
  }
  interface AsyncDisposableStackConstructor {
    /** {@link Stamper} that stamps {@link AsyncDisposableStack} into {@link AsyncDisposable} object */
    readonly stamper: Stamper<AsyncDisposable, AsyncDisposableStack>;
  }
}
defineProperty(DisposableStack, "stamper", {
  value: new Stamper<Disposable, DisposableStack>((object) => {
    const stack = new DisposableStack();
    if (isDisposable(object)) stack.append(object[Symbol.dispose].bind(object));
    appendMethod(object, Symbol.dispose, () => stack.dispose());
    return stack;
  }),
  writable: false,
  enumerable: false,
  configurable: true,
});
defineProperty(AsyncDisposableStack, "stamper", {
  value: new Stamper<AsyncDisposable, AsyncDisposableStack>((object) => {
    const stack = new AsyncDisposableStack();
    if (isDisposable.async(object)) stack.append(object[Symbol.asyncDispose].bind(object));
    if (isDisposable(object)) {
      stack.append(object[Symbol.dispose].bind(object));
      // @ts-expect-error(2790) - deletes old Symbol.dispose method
      delete object[Symbol.dispose];
    }
    appendMethod(object, Symbol.asyncDispose, () => stack.disposeAsync());
    return stack;
  }),
  writable: false,
  enumerable: false,
  configurable: true,
});

declare global {
  interface SuppressedError {
    /** Returns original suppressed error */
    original(): unknown;
  }
}
defineMethod(SuppressedError.prototype, "original", function original() {
  return this.suppressed instanceof SuppressedError ? this.suppressed.original() : this.suppressed;
});

declare global {
  interface SuppressedError {
    /** Flattens errors and return as array */
    flatten(): unknown[];
  }
}
defineMethod(SuppressedError.prototype, "flatten", function flatten() {
  const errors = [this.error] as unknown[];
  if (this.suppressed instanceof SuppressedError) errors.push(...this.suppressed.flatten());
  else errors.push(this.suppressed);
  return errors;
});

declare global {
  interface SuppressedErrorConstructor {
    /**
     * Calls {@link fn} and rethrows {@link error} and in case it does throws new error
     * wraps both of them into {@link SuppressedError}.
     *
     * @example
     *  const disposables = DisposableStack.transaction(() => ...)
     *  try {
     *    fn()
     *    disposables[Symbol.dispose]()
     *  } catch (error) {
     *    SuppressedError.suppress(error, () => disposables[Symbol.dispose]())
     *  }
     */
    suppress(error: unknown, fn: () => void): never;
    /**
     * Calls {@link fn} and rethrows {@link error} and in case it does throws new error
     * wraps both of them into {@link SuppressedError}.
     *
     * @example
     *  const disposables = AsyncDisposableStack.transaction(() => ...)
     *  try {
     *    fn()
     *    disposables[Symbol.asyncDispose]()
     *  } catch (error) {
     *    SuppressedError.suppressAsync(error, () => disposables[Symbol.asyncDispose]())
     *  }
     */
    suppressAsync(error: unknown, fn: () => Promise<void>): Promise<never>;
  }
}
defineMethod(SuppressedError, "suppress", function suppress(error: unknown, fn: () => void) {
  try {
    fn();
  } catch (fnError) {
    throw new SuppressedError(fnError, error);
  }
  throw error;
});
defineMethod(SuppressedError, "suppressAsync", async function suppress(error: unknown, fn: () => Promise<void>) {
  try {
    await fn();
  } catch (fnError) {
    throw new SuppressedError(fnError, error);
  }
  throw error;
});

export {};
