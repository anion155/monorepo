import { defineMethod, Stamper } from "@anion155/shared";

import { SmartWeakRef } from "../../shared/src/global/emplace";
import { SignalReadonlyComputed } from "./computed-readonly";
import { SignalWritableComputed } from "./computed-writable";
import { SignalReadonly } from "./signal-readonly";

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

export {};
