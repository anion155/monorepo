import { doThrow } from "./do";
import { DeveloperError } from "./errors";
import { defineProperty } from "./object";
import { isPromise } from "./promise";

export type MaybePromise<Value> = [Value] extends [never] ? Maybe<never> : Value extends Promise<infer Nested> ? Promise<Nested> : Maybe<Value>;

export type MaybeState<Value> = { status: "resolved"; value: Value } | { status: "rejected"; reason: unknown };

const maybeConstructorFlag = Symbol.for("Maybe#constructor");
export class Maybe<Value> {
  declare readonly [Symbol.toStringTag]: string;

  readonly #state: MaybeState<Value>;

  /**
   * Maybe's constructor is not supported.
   * @deprecated
   */
  constructor() {
    /* eslint-disable prefer-rest-params, @typescript-eslint/no-unsafe-assignment */
    if (arguments.length === 2 && arguments[0] === maybeConstructorFlag) {
      this.#state = arguments[1];
      if (this.#state.status === "resolved") {
        if (isPromise(this.#state.value)) throw new DeveloperError("Maybe does not support nested Promise");
        if (this.#state.value instanceof Maybe) this.#state = this.#state.value.#state;
      }
    } else {
      throw new DeveloperError("Maybe's constructor is not supported");
    }
    /* eslint-enable prefer-rest-params, @typescript-eslint/no-unsafe-assignment */
  }
  /**
   * Creates a new resolved Maybe.
   * @returns A resolved Maybe.
   */
  static resolve(): Maybe<void>;
  /**
   * Creates a new resolved Promise for the provided promise.
   * @param promise
   * @returns A Promise whose internal state matches the provided promise.
   */
  static resolve<Value>(promise: Promise<Value>): Promise<Value>;
  /**
   * Creates a new resolved Maybe for the provided value.
   * @param value
   * @returns A Maybe whose internal state matches the provided value.
   */
  static resolve<Value>(value: Value): Maybe<Awaited<Value>>;
  static resolve<Value>(value?: Value) {
    if (isPromise(value)) return Promise.resolve(value);
    return new MaybeConstructor<Value | undefined>(maybeConstructorFlag, { status: "resolved", value });
  }
  static reject(reason: unknown): Maybe<never> {
    return new MaybeConstructor<never>(maybeConstructorFlag, { status: "rejected", reason });
  }
  /**
   * Takes a callback of any kind (returns or throws, synchronously or asynchronously) and wraps its result
   * in a Maybe or Promise accordingly.
   *
   * @param callback.
   * @returns:
   * - Promise, if the callback returned Promise.
   * - Maybe, otherwise.
   */
  static try<Value>(callback: () => Value): MaybePromise<Value> {
    try {
      const result = callback();
      if (isPromise(result)) return result as never;
      return Maybe.resolve(result) as never;
    } catch (error) {
      return Maybe.reject(error) as never;
    }
  }

  /**
   * Returns currently stored value, or throws stored error.
   */
  unwrap(): Value {
    if (this.#state.status === "resolved") {
      return this.#state.value;
    } else {
      throw this.#state.reason;
    }
  }

  /**
   * Projects current Maybe with callback into Promise.
   * @param onfulfilled The callback to execute if the Maybe is resolved.
   * @returns A Promise with value projected by callback.
   */
  then<Result1 = Value>(onfulfilled: (value: Value) => Promise<Result1>): Promise<Result1>;
  /**
   * Projects current Maybe with callback into Promise.
   * @param onfulfilled The callback to execute if the Maybe is resolved.
   * @param onrejected The callback to execute if the Maybe is rejected.
   * @returns A Promise with value projected by callback.
   */
  then<Result1 = Value, Result2 = never>(
    onfulfilled: (value: Value) => Promise<Result1>,
    onrejected: (reason: unknown) => Promise<Result2>,
  ): Promise<Result1 | Result2>;
  /**
   * Projects current Maybe with callback.
   * @param onfulfilled The callback to execute if the Maybe is resolved.
   * @param onrejected The callback to execute if the Maybe is rejected.
   * @returns A Maybe if callback did not returned Promise, otherwise it returns Promise.
   */
  then<Result1 = Value, Result2 = never>(
    onfulfilled?: ((value: Value) => Result1) | null,
    onrejected?: ((reason: unknown) => Result2) | null,
  ): MaybePromise<Result1> | MaybePromise<Result2>;
  then<Result1 = Value, Result2 = never>(
    onfulfilled?: ((value: Value) => Result1) | null,
    onrejected?: ((reason: unknown) => Result2) | null,
  ): MaybePromise<Result1> | MaybePromise<Result2> {
    let handler: () => void;
    if (this.#state.status === "resolved") {
      const value = this.#state.value;
      if (onfulfilled) handler = () => onfulfilled(value);
      else handler = () => value;
    } else {
      const reason = this.#state.reason;
      if (onrejected) handler = () => onrejected(reason);
      else handler = () => doThrow(reason);
    }
    try {
      const result = handler();
      if (isPromise(result)) return result as never;
      return Maybe.resolve(result) as never;
    } catch (error) {
      return Maybe.reject(error) as never;
    }
  }

  /**
   * Projects current rejected Maybe with callback.
   * @param onrejected The callback to execute if the Maybe is rejected.
   * @returns A Maybe if callback did not returned Promise, otherwise it returns Promise.
   */
  catch<Result = never>(onrejected?: ((reason: unknown) => Result) | null): MaybePromise<Result> {
    return this.then(null, onrejected);
  }

  /**
   * Invokes a callback.
   * @param onfinally The callback to execute.
   * @returns A Maybe with same state, unless callback throws an error.
   */
  finally(onfinally?: (() => void) | null): Maybe<Value> {
    return this.then(
      (result) => {
        onfinally?.();
        return result;
      },
      (reason) => {
        onfinally?.();
        throw reason;
      },
    ) as never;
  }
}
const MaybeConstructor = Maybe as {
  new <Value>(flag: typeof maybeConstructorFlag, state: MaybeState<Value>): Maybe<Value>;
};
defineProperty(Maybe.prototype, Symbol.toStringTag, { value: "Maybe", writable: false, enumerable: false, configurable: true });
