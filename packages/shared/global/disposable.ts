import { isDisposable } from "@/disposable";
import { DeveloperError } from "@/errors";
import { appendMethod, defineMethod, defineProperty } from "@/object";
import { Stamper } from "@/stamper";

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
    append(...disposables: Array<DisposableStackArgument>): void;
  }
  interface AsyncDisposableStack {
    /** Append any kind of disposables */
    append(...disposables: Array<AsyncDisposableStackArgument>): void;
  }
}
defineMethod(DisposableStack.prototype, "append", function append(this: DisposableStack, ...disposables) {
  disposables.forEach((disposable) => {
    if (isDisposable(disposable)) this.use(disposable);
    else if (typeof disposable === "function") this.defer(disposable);
  });
});
defineMethod(AsyncDisposableStack.prototype, "append", function append(this: AsyncDisposableStack, ...disposables) {
  disposables.forEach((disposable) => {
    if (isDisposable(disposable) || isDisposable.async(disposable)) this.use(disposable);
    else if (typeof disposable === "function") this.defer(disposable);
  });
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
    try {
      stack.dispose();
    } catch (disposeError) {
      throw new SuppressedError(disposeError, error);
    }
    throw error;
  }
});
defineMethod(AsyncDisposableStack, "transaction", async function transaction(fn, passedStack) {
  const stack = passedStack ?? new AsyncDisposableStack();
  try {
    await fn(stack);
    return stack.move();
  } catch (error) {
    try {
      await stack.disposeAsync();
    } catch (disposeError) {
      throw new SuppressedError(disposeError, error);
    }
    throw error;
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
});
