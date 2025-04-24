import { defineMethod, Stamper } from "@anion155/shared";

import { SmartWeakRef } from "../../shared/src/global/emplace";
import { SignalReadonlyComputed } from "./computed-readonly";
import { SignalWritableComputed } from "./computed-writable";
import { SignalReadonly } from "./signal-readonly";
import { SignalWritable } from "./signal-writable";

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

declare module "./signal-readonly" {
  interface SignalReadonly<Value> {
    get(): Value;
    get<Field extends keyof Value>(field: Field): Value[Field];
    get<F1 extends keyof Value, F2 extends keyof Value[F1]>(field1: F1, field2: F2): Value[F1][F2];
    get<F1 extends keyof Value, F2 extends keyof Value[F1], F3 extends keyof Value[F1][F2]>(field1: F1, field2: F2, field3: F3): Value[F1][F2][F3];
    get<F1 extends keyof Value, F2 extends keyof Value[F1], F3 extends keyof Value[F1][F2], F4 extends keyof Value[F1][F2][F3]>(
      field1: F1,
      field2: F2,
      field3: F3,
      field4: F4,
    ): Value[F1][F2][F3][F4];
    get<
      F1 extends keyof Value,
      F2 extends keyof Value[F1],
      F3 extends keyof Value[F1][F2],
      F4 extends keyof Value[F1][F2][F3],
      F5 extends keyof Value[F1][F2][F3][F4],
    >(
      field1: F1,
      field2: F2,
      field3: F3,
      field4: F4,
      field5: F5,
    ): Value[F1][F2][F3][F4][F5];
    get(...fields: PropertyKey[]): unknown;
  }
}
defineMethod(SignalReadonly.prototype, "get", function get<Value>(this: SignalReadonly<Value>, ...fields: PropertyKey[]) {
  let signal: SignalReadonly<unknown> = this as never;
  signal.subscribe();
  while (fields.length > 0) {
    signal = signal.field(fields.shift() as never);
    signal.subscribe();
  }
  return signal.peak();
});

declare module "./signal-writable" {
  interface SignalWritable<Value> {
    set(next: Value): void;
    set<Field extends keyof Value>(field: Field, next: Value[Field]): void;
    set<F1 extends keyof Value, F2 extends keyof Value[F1]>(field1: F1, field2: F2, next: Value[F1][F2]): void;
    set<F1 extends keyof Value, F2 extends keyof Value[F1], F3 extends keyof Value[F1][F2]>(
      field1: F1,
      field2: F2,
      field3: F3,
      next: Value[F1][F2][F3],
    ): void;
    set<F1 extends keyof Value, F2 extends keyof Value[F1], F3 extends keyof Value[F1][F2], F4 extends keyof Value[F1][F2][F3]>(
      field1: F1,
      field2: F2,
      field3: F3,
      field4: F4,
      next: Value[F1][F2][F3][F4],
    ): void;
    set<
      F1 extends keyof Value,
      F2 extends keyof Value[F1],
      F3 extends keyof Value[F1][F2],
      F4 extends keyof Value[F1][F2][F3],
      F5 extends keyof Value[F1][F2][F3][F4],
    >(
      field1: F1,
      field2: F2,
      field3: F3,
      field4: F5,
      field5: F5,
      next: Value[F1][F2][F3][F4][F5],
    ): void;
  }
}
defineMethod(SignalWritable.prototype, "set", function set<Value>(this: SignalWritable<Value>, ...params: unknown[]) {
  const value = params.pop();
  const fields = params as PropertyKey[];
  let signal: SignalWritable<unknown> = this as never;
  while (fields.length > 0) {
    signal = signal.field(fields.shift() as never);
  }
  signal._set(value);
});

export {};
