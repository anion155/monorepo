import { compare, defineMethod, DeveloperError, isObject, Stamper } from "@anion155/shared";

import { SmartWeakRef } from "../../shared/src/global/emplace";
import { SignalReadonlyComputed } from "./computed-readonly";
import { SignalWritableComputed } from "./computed-writable";
import { depends } from "./internals";
import { SignalReadonly } from "./signal-readonly";
import type { SignalListener } from "./types";

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
const emptyListener: unique symbol = {} as never;
const snapshots = new Stamper<SignalReadonly<unknown>, [object, WeakMap<SignalListener | typeof emptyListener, object>]>();
defineMethod(SignalReadonly.prototype, "snapshot", function snapshot<Value>(this: SignalReadonly<Value>, listener?: SignalListener) {
  if (!depends.dependents.has(this)) throw new DeveloperError("this signal does not support proxy call");
  if (!isObject(this.peak())) return this.peak();
  const value = this.peak();
  const target = { ...value } as object;
  Object.setPrototypeOf(target, Object.getPrototypeOf(value) as never);
  Object.preventExtensions(target);
  Object.freeze(target);
  if (snapshots.has(this)) {
    const stored = snapshots.get(this);
    if (!compare(target, stored[0], 1)) {
      snapshots.remove(this);
    } else if (stored[1].has(listener ?? emptyListener)) {
      return stored[1].get(listener ?? emptyListener)!;
    }
  }
  if (listener) depends.bind(listener, this);
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const signal = this;
  const proxy = new Proxy(target, {
    get(target, p) {
      if (listener) depends.bind(listener, signal.field(p as never));
      return target[p as never];
    },
  });
  if (snapshots.has(this)) {
    snapshots.get(this as never)[1].set(listener ?? emptyListener, proxy);
  } else {
    snapshots.stamp(this as never, [target, new WeakMap([[listener ?? emptyListener, proxy]])]);
  }
  return proxy;
});
