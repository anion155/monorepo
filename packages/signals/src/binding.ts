import { context, depends } from "./internals";
import { SignalWritable } from "./signal-writable";
import type { SignalDependentDependency, SignalListener, SignalValue } from "./types";

export type SignalBindingArgument<Value> = Value | { (): Value };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface SignalBinding<Value> extends SignalDependentDependency {}
/**
 * Binding Signal, can be either value or computed value from other signals.
 *
 * @example
 * const a = new SignalBinding(5);
 * const a = new SignalBinding(() => a.value);
 */
export class SignalBinding<Value> extends SignalWritable<Value, SignalBindingArgument<Value>> implements SignalValue<Value>, SignalListener {
  #latest!: Value;
  #binding: null | { (): Value } = null;

  constructor(current: SignalBindingArgument<Value>) {
    super();
    depends.dependencies.stamp(this);
    depends.dependents.stamp(this);
    if (typeof current === "function") {
      this.#binding = current as () => Value;
      this.invalidate();
    } else {
      this.#latest = current;
    }
  }

  peak() {
    return this.#latest;
  }
  protected _set(value: SignalBindingArgument<Value>) {
    if (value === this.#binding) return;
    this.unbind();
    if (value === this.#latest) return;
    if (typeof value === "function") {
      this.#binding = value as { (): Value };
      this.invalidate();
    } else {
      this.#latest = value;
    }
    using batching = context.setupBatchingContext();
    batching.invalidate(this);
  }

  invalidate() {
    if (!this.#binding) return;
    using _subscription = context.setupSubscriptionContext(this);
    this.#latest = this.#binding();
  }

  unbind() {
    if (this.#binding) depends.clearDependecies(this);
    this.#binding = null;
  }
  bind(binder: { (): Value }) {
    this._set(binder);
  }
}
