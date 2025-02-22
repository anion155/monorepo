import { createContextStack, is, updateProperty } from "@anion155/shared";

import { createDependTools, type Dependency, type Dependent, type DependentDependency } from "@anion155/shared";
export { CircularDependencyError } from "@anion155/shared";

export interface Signal extends Disposable {}
export class Signal {
  constructor() {
    DisposableStack.stamper.stamp(this).append(() => {
      if (dependencies.is(this)) dependencies.get(this).forEach((dependency) => unbind(this, dependency));
      if (dependents.is(this)) dependents.get(this).forEach((dependent) => dependent[Symbol.dispose]());
    });
  }
  get disposed() {
    return DisposableStack.stamper.get(this).disposed;
  }
  dispose() {
    DisposableStack.stamper.get(this).dispose();
  }
}
updateProperty(Signal.prototype, "disposed", { enumerable: false });
const invalidate = Symbol.for("Signal#invalidate");

interface SignalDependent extends Signal, Dependent {
  [invalidate](): void;
}
interface SignalReadonlyDependency<Value> extends Signal, Dependency {
  get(): Value;
}
interface SignalWritableDependency<Value> extends Signal, SignalReadonlyDependency<Value> {
  set(value: Value): void;
}
const { dependents, dependencies, bind, unbind } = createDependTools<
  SignalDependent,
  SignalReadonlyDependency<unknown> | SignalWritableDependency<unknown>
>();

const signalsContext = createContextStack<{ type: "empty" } | { type: "subscription"; dependent: SignalDependent }>({ type: "empty" });

export interface SignalState<Value> extends Dependency {}
export class SignalState<Value> extends Signal implements SignalWritableDependency<Value> {
  #current: Value;

  constructor(initialValue: Value) {
    super();
    dependents.stamp(this);
    this.#current = initialValue;
  }

  get() {
    const context = signalsContext.current();
    if (context.type === "subscription") {
      bind(context.dependent, this);
    }
    return this.#current;
  }
  set(next: Value) {
    this.#current = next;
    dependents.get(this).forEach((dependent) => dependent[invalidate]());
  }
}

type PromiseCancelable<T> = Promise<T> & { cancel(reason?: unknown): void };

function asynchronizeInvalidate<Target extends { [invalidate](): void }>(target: Target) {
  const method = target[invalidate];
  let state: PromiseCancelable<void> | undefined;
  target[invalidate] = () => {
    if (state) return;
    const controller = new AbortController();
    const promise = Promise.resolve().then(() => {
      if (controller.signal.aborted) return;
      state = undefined;
      method.call(target);
    });
    state = Object.assign(promise, {
      cancel: (reason?: unknown) => {
        state = undefined;
        controller.abort(reason);
      },
    });
  };
  return { sync: method.bind(target), cancel: (reason?: unknown) => state?.cancel(reason) };
}

export type EffectCleanup = { (): void } | void;
export type EffectCallback = { (): EffectCleanup };

export interface SignalEffect extends Dependent {}
export class SignalEffect extends Signal implements SignalDependent {
  #callback: EffectCallback;
  #cleanup: EffectCleanup = undefined;

  constructor(
    cb: EffectCallback,
    readonly sync: boolean = false,
  ) {
    super();
    dependencies.stamp(this);
    DisposableStack.stamper.get(this).append(() => this.#cleanup?.());
    this.#callback = cb;

    if (!sync) {
      const asyncInvalidate = asynchronizeInvalidate(this);
      DisposableStack.stamper.get(this).append(() => asyncInvalidate.cancel());
      asyncInvalidate.sync();
    } else {
      this[invalidate]();
    }
  }

  [invalidate]() {
    this.#cleanup?.();
    using subscription = signalsContext.setup({ type: "subscription", dependent: this });
    this.#cleanup = this.#callback();
  }
}

export interface SignalComputed<Value> extends DependentDependency {}
export class SignalComputed<Value> extends Signal implements SignalDependent, SignalReadonlyDependency<Value> {
  #current!: Value;
  #compute: () => Value;

  constructor(compute: () => Value) {
    super();
    dependencies.stamp(this);
    dependents.stamp(this);
    this.#compute = compute;
    this[invalidate]();
  }

  get() {
    const context = signalsContext.current();
    if (context.type === "subscription") {
      bind(context.dependent, this);
    }
    return this.#current;
  }
  [invalidate]() {
    using subscription = signalsContext.setup({ type: "subscription", dependent: this });
    this.#current = this.#compute();
    dependents.get(this).forEach((dependent) => dependent[invalidate]());
  }
}

export const signals = {
  is: is.create(Signal),
  state: <Value>(initialValue: Value) => new SignalState(initialValue),
  effect: (cb: EffectCallback, sync?: boolean) => new SignalEffect(cb, sync),
  computed: <Value>(compute: () => Value) => new SignalComputed(compute),
};
