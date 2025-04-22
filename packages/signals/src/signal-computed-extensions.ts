import { defineMethod, DeveloperError, isObject, Stamper } from "@anion155/shared";

import { SmartWeakRef } from "../../shared/src/global/emplace";
import { SignalReadonlyComputed } from "./computed-readonly";
import { SignalWritableComputed } from "./computed-writable";
import { depends } from "./internals";
import { SignalReadonly } from "./signal-readonly";
import type { SignalDependency, SignalListener } from "./types";

declare module "./signal-readonly" {
  interface SignalReadonly<Value> {
    /** Creates {@link SignalReadonlyComputed} that projects from current signal. */
    map<Computed>(project: (value: Value) => Computed): SignalReadonlyComputed<Computed>;
  }
}
defineMethod(SignalReadonly.prototype, "map", function map<Value, Computed>(this: SignalReadonly<Value>, project: (value: Value) => Computed) {
  return new SignalReadonlyComputed<Computed>(() => project(this.get()));
});

declare module "./signal-readonly" {
  interface SignalReadonly<Value> {
    /** Creates {@link SignalReadonlyComputed} that get value from current value on {@link field} */
    view<Field extends keyof Value>(field: Field): SignalReadonlyComputed<Value[Field]>;
  }
}
const views = new Stamper((signal: SignalReadonly<unknown>) => {
  return Map.withFabric((field) => {
    return new SmartWeakRef(
      () =>
        new SignalReadonlyComputed(() => {
          const value = signal.get();
          return Reflect.get(value as never, field as never, value);
        }),
    );
  });
});
defineMethod(SignalReadonly.prototype, "view", function view<Value, Field extends keyof Value>(this: SignalReadonly<Value>, field: Field) {
  return views
    .emplace(this as never)
    .emplace(field)
    .emplace();
} as never);

declare module "./signal-readonly" {
  interface SignalReadonly<Value> {
    /** Creates {@link SignalWritableComputed} that get value from current value on {@link field} */
    field<Field extends keyof Value>(field: Field): SignalWritableComputed<Value[Field]>;
  }
}
const fields = new Stamper((signal: SignalReadonly<unknown>) => {
  return Map.withFabric((field) => {
    return new SmartWeakRef(
      () =>
        new SignalWritableComputed(
          () => {
            const value = signal.get();
            return Reflect.get(value as never, field as never, value);
          },
          (next) => {
            const value = signal.peak();
            Reflect.set(value as never, field as never, next);
          },
        ),
    );
  });
});
defineMethod(SignalReadonly.prototype, "field", function field<Value, Field extends keyof Value>(this: SignalReadonly<Value>, field: Field) {
  return fields
    .emplace(this as never)
    .emplace(field)
    .emplace();
} as never);

declare module "./signal-readonly" {
  interface SignalReadonly<Value> {
    /**
     * Creates snapshot of current value. Accessing any field of this snapshot
     * triggers subscription of {@link listener} or listener in context
     * (set up during getter of {@link SignalReadonlyComputed} or effect {@link SignalEffect} is called)
     */
    snapshot(listener?: SignalListener): DeepReadonly<Value>;
  }
}
const empty: unique symbol = {} as never;
const snapshots = new Stamper((signal: SignalDependency & SignalReadonly<object>) => {
  return WeakMap.withFabric((value: object) =>
    WeakMap.withFabric((listener: SignalListener | typeof empty) => {
      // TODO: clone object
      const target = { ...value } as object;
      Object.setPrototypeOf(target, Object.getPrototypeOf(value) as never);
      Object.preventExtensions(target);
      Object.freeze(target);
      if (listener !== empty) depends.bind(listener, signal);
      return new Proxy(target, {
        get(target, p) {
          if (listener !== empty) depends.bind(listener, signal.view(p as never));
          return target[p as never];
        },
      });
    }),
  );
});
defineMethod(SignalReadonly.prototype, "snapshot", function snapshot<Value>(this: SignalReadonly<Value>, listener?: SignalListener) {
  if (!isObject(this.peak())) return this.peak();
  if (!depends.dependents.has(this)) throw new DeveloperError("this signal does not support proxy call");
  return snapshots
    .emplace(this as never)
    .emplace(this.peak() as never)
    .emplace(listener ?? empty);
});
