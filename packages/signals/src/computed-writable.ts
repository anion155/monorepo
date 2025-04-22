import "./computed-readonly";

import { createErrorClass, defineMethod, defineToStringTag, DeveloperError, Stamper } from "@anion155/shared";

import { context, depends } from "./internals";
import { SignalWritable } from "./signal-writable";
import type { SignalDependentDependency, SignalListener, SignalValue } from "./types";

export class SignalReadonlyError extends createErrorClass("SignalReadonlyError") {}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface SignalWritableComputed<Value> extends SignalDependentDependency {}
/**
 * By-directional computed Signal, that can be used as computed writable state.
 *
 * @example
 * const state = new SignalState(5);
 * const stateSin = new SignalWritableComputed(
 *   () => Math.sin(state.value),
 *   sin => state.set(Math.asin(sin)),
 * );
 */
export class SignalWritableComputed<Value> extends SignalWritable<Value> implements SignalValue<Value>, SignalListener {
  #current!: Value;
  #getter: () => Value;
  #setter: (value: Value) => void;

  constructor(getter: () => Value, setter: (value: Value) => void) {
    super();
    depends.dependencies.stamp(this);
    depends.dependents.stamp(this);
    this.#getter = getter;
    this.#setter = setter;
    this.invalidate();
  }

  peak() {
    return this.#current;
  }
  set(value: Value) {
    if (value === this.#current) return;
    this.#current = value;
    using batching = context.setupBatchingContext();
    batching.invalidate(this);
    this.#setter(value);
  }

  invalidate() {
    using _subscription = context.setupSubscriptionContext(this);
    this.#current = this.#getter();
  }
}
defineToStringTag(SignalWritableComputed);

declare module "./signal-writable" {
  interface SignalWritable<Value> {
    /** Creates {@link SignalWritableComputed} that let's you get and modify value of {@link field}. */
    field<Field extends Value extends object ? keyof Value : never>(field: Field): SignalWritableComputed<Value[Field]>;
    /**
     * Creates {@link Proxy} object that can be used to subscribe to specific field of the value.
     *
     * @example
     * const effect = new SignalEffect(() => {
     *   // subscribe only to a and b fields or whole state's value is changed
     *   const { a, b } = state.proxy();
     *   console.log("sum:", a + b)
     * });
     */
    proxy(listener?: SignalListener): Value extends object ? Value : never;
  }
}
const fields = new Stamper((signal: SignalWritable<unknown>) => {
  return Map.withFabric((field) => {
    return new SignalWritableComputed(
      () => {
        const value = signal.get();
        return Reflect.get(value as never, field as never);
      },
      (next) => {
        const value = signal.peak();
        Reflect.set(value as never, field as never, next);
      },
    );
  });
});
defineMethod(SignalWritable.prototype, "field", function field<Value, Field extends keyof Value>(this: SignalWritable<Value>, field: Field) {
  if (!fields.has(this)) fields.stamp(this as never);
  return fields.get(this as never).emplace(field) as never;
});
defineMethod(SignalWritable.prototype, "proxy", function proxy<Value>(this: SignalWritable<Value>, listener?: SignalListener) {
  if (!depends.dependents.has(this)) throw new DeveloperError("this signal does not support proxy call");
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const signal = this;
  const signalsContext = context.current();
  if (listener === undefined && signalsContext.type === "subscription") listener = signalsContext.listener;
  return new Proxy(this.peak() as never, {
    get(_, prop) {
      const field = signal.field(prop as never);
      if (listener) depends.bind(listener, field);
      if (typeof signal.peak() !== "object" || typeof field.peak() !== "object") return field.peak();
      return field.proxy(listener);
    },
    set(_, prop, next) {
      signal.field(prop as never).set(next as never);
      return true;
    },
    has(_, prop) {
      return Reflect.has(signal.peak() as never, prop);
    },
    ownKeys() {
      return Object.keys(signal.peak() as never);
    },
    defineProperty(_, prop, desc) {
      Object.defineProperty(signal.peak(), prop, desc);
      signal.field(prop as never);
      return true;
    },
    deleteProperty(_, prop) {
      delete signal.peak()[prop as never];
      if (!fields.has(signal)) fields.stamp(signal as never);
      const signalFields = fields.get(signal as never);
      signalFields.get(prop)?.dispose();
      signalFields.delete(prop);
      return true;
    },
    getOwnPropertyDescriptor(_, prop) {
      return Object.getOwnPropertyDescriptor(signal.peak(), prop);
    },
    isExtensible() {
      return Object.isExtensible(signal.peak());
    },
    preventExtensions() {
      Object.preventExtensions(signal.peak());
      return true;
    },
    getPrototypeOf() {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return Object.getPrototypeOf(signal.peak());
    },
    setPrototypeOf(_, proto) {
      Object.setPrototypeOf(signal.peak(), proto);
      return true;
    },
    apply(_, context, params) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return Reflect.apply(signal.peak() as never, context, params);
    },
    construct(_, params, target) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return Reflect.construct(signal.peak() as never, params, target);
    },
  });
});
