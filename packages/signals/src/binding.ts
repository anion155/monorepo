import { identity } from "@anion155/shared";

import { context, depends } from "./internals";
import { SignalWritable } from "./signal-writable";
import type { SignalDependentDependency, SignalListener, SignalValue } from "./types";

export type SignalBindingArgument<Value> = Value | { (): Value };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface SignalBinding<Value, Argument = never> extends SignalDependentDependency {}
/**
 * Binding Signal, can be either value or computed value from other signals.
 *
 * @example
 * const a = new SignalBinding(5);
 * const a = new SignalBinding(() => a.value);
 */
export class SignalBinding<Value, Argument = never>
  extends SignalWritable<Value, SignalBindingArgument<Value | Argument>>
  implements SignalValue<Value>, SignalListener
{
  #parser: (argument: Value | Argument) => Value;
  #latest!: Value;
  #binding: null | { (): Value } = null;

  constructor(
    current: SignalBindingArgument<Value | Argument>,
    ...[parser]: IfEquals<
      Exclude<Argument, Value>,
      never,
      [parser?: (argument: Value | NoInfer<Argument>) => Value],
      [parser: (argument: Value | NoInfer<Argument>) => Value]
    >
  ) {
    super();
    depends.dependencies.stamp(this);
    depends.dependents.stamp(this);
    this.#parser = parser ?? (identity as never);
    if (typeof current === "function") {
      this.#binding = current as () => Value;
      this.invalidate();
    } else {
      this.#latest = this.#parser(current);
    }
  }

  peak() {
    return this.#latest;
  }
  protected _set(value: SignalBindingArgument<Value | Argument>) {
    if (value === this.#binding) return;
    this.unbind();
    if (value === this.#latest) return;
    if (typeof value === "function") {
      this.#binding = value as { (): Value };
      this.invalidate();
    } else {
      this.#latest = this.#parser(value);
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
  bind(binder: { (): Value | Argument }) {
    this._set(binder);
  }
}
