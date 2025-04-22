import { defineMethod, DeveloperError, Stamper } from "@anion155/shared";

import { SignalReadonlyComputed } from "./computed-readonly";
import { SignalWritableComputed } from "./computed-writable";
import { context, depends } from "./internals";
import { SignalReadonly } from "./signal-readonly";
import type { SignalListener } from "./types";

declare module "./signal-readonly" {
  interface SignalReadonly<Value> {
    /** Creates {@link SignalReadonlyComputed} that projects from current signal. */
    map<Computed>(project: (value: Value) => Computed): SignalReadonlyComputed<Computed>;
    /** Creates {@link SignalReadonlyComputed} that get value from current value on {@link field} */
    view<Field extends keyof Value>(field: Field): SignalReadonlyComputed<Value[Field]>;
    /** Creates {@link SignalWritableComputed} that get value from current value on {@link field} */
    field<Field extends keyof Value>(field: Field): SignalWritableComputed<Value[Field]>;
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
    proxy(listener?: SignalListener): Value;
  }
}
defineMethod(SignalReadonly.prototype, "map", function map<Value, Computed>(this: SignalReadonly<Value>, project: (value: Value) => Computed) {
  return new SignalReadonlyComputed<Computed>(() => project(this.get()));
});
const views = new Stamper((signal: SignalReadonly<unknown>) => {
  return Map.withFabric((field) => {
    return new SignalReadonlyComputed(() => {
      const value = signal.get();
      return Reflect.get(value as never, field as never, value);
    });
  });
});
defineMethod(SignalReadonly.prototype, "view", function view<Value, Field extends keyof Value>(this: SignalReadonly<Value>, field: Field) {
  if (!views.has(this)) views.stamp(this as never);
  return views.get(this as never).emplace(field);
} as never);
const fields = new Stamper((signal: SignalReadonly<unknown>) => {
  return Map.withFabric((field) => {
    return new SignalWritableComputed(
      () => {
        const value = signal.get();
        return Reflect.get(value as never, field as never, value);
      },
      (next) => {
        const value = signal.peak();
        Reflect.set(value as never, field as never, next);
      },
    );
  });
});
defineMethod(SignalReadonly.prototype, "field", function field<Value, Field extends keyof Value>(this: SignalReadonly<Value>, field: Field) {
  if (!fields.has(this)) fields.stamp(this as never);
  return fields.get(this as never).emplace(field);
} as never);
defineMethod(SignalReadonly.prototype, "proxy", function proxy<Value>(this: SignalReadonly<Value>, listener?: SignalListener) {
  if (!depends.dependents.has(this)) throw new DeveloperError("this signal does not support proxy call");
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const signal = this;
  const signalsContext = context.current();
  if (listener === undefined && signalsContext.type === "subscription") listener = signalsContext.listener;
  const initial = this.peak();
  if (typeof initial !== "object" || initial === null) return initial;
  return new Proxy(initial as never, {
    get(_, prop) {
      const field = signal.field(prop as never);
      if (listener) depends.bind(listener, field);
      if (typeof field.peak() !== "object") return field.peak();
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
