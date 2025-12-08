import "../global/disposable";

import { createErrorClass } from "../errors";
import { Maybe } from "../maybe";
import { compare } from "../misc";
import type { ActionContext } from "./action";
import { Action, InvalidActionState } from "./action";

export type InitializerContext = OmitHelper<ActionContext, "action"> & {
  initializer: Initializer<unknown[], unknown>;
  stack: AsyncDisposableStack;
};

export type InitializerCallback<Params extends unknown[], Value> = (this: InitializerContext, ...params: Params) => Promise<Value> | Value;

/**
 * Initialize action.
 * @example
 *  const initializer = new Initializer(liftContext(({ stack }) => {
 *    stack.append(() => console.log('disposed'));
 *    console.log('initialized')
 *    return Promise.wait();
 *  ));
 *  await initializer.run(); // logs: initialized
 *  await initializer.run(); // Cached by default
 *  await initializer.dispose(); // logs: disposed
 */
export class Initializer<Params extends unknown[], Value> extends Action<Params, Value> {
  #stack = new AsyncDisposableStack();

  constructor(fn: InitializerCallback<Params, Value>) {
    super(function (this, ...params) {
      const stack = new AsyncDisposableStack();
      const initializer = this.action as Initializer<unknown[], unknown>;
      const result = Maybe.try(() => fn.call({ ...this, initializer, stack }, ...params))
        .then(
          (value) => {
            initializer.#stack = stack.move();
            initializer.#deferred.resolve(value);
            return value;
          },
          (reason) => SuppressedError.suppressAsync(reason, () => stack.disposeAsync()),
        )
        .catch((reason) => {
          initializer.#deferred.reject(reason);
          throw reason;
        }) as never as Maybe<Value> | Promise<Value>;
      return result instanceof Maybe ? result.unwrap() : result;
    });
    this.#deferred = Promise.withResolvers<Value>();
    this.#deferred.promise.catch(() => {}) as never;
  }
  async [Symbol.asyncDispose]() {
    await this.#stack.move().disposeAsync();
  }
  async dispose() {
    await this[Symbol.asyncDispose]();
  }

  get initialized() {
    return this.state.status === "resolved";
  }

  #deferred: PromiseWithResolvers<Value>;
  get deferred() {
    return this.#deferred.promise;
  }

  run(...params: Params): Promise<Value> {
    if (this.running.status === "pending") {
      if (!this.running.promise) throw new InvalidActionState();
      if (compare(this.running.params, params)) return this.running.promise;
      this.cancel();
    }
    if (this.result?.status === "resolved" && compare(this.result.params, params)) {
      return Promise.resolve(this.result.value);
    }
    return super.run(...params);
  }

  get value() {
    const { state } = this;
    if (state.status !== "resolved") throw new NotInitialized("this value is not initialized yet");
    return state.value;
  }
}

export class NotInitialized extends createErrorClass("NotInitialized") {}
