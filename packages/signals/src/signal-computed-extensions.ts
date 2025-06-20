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

const same = {};

declare module "./signal-readonly" {
  interface SignalReadonly<Value> {
    /** Creates {@link SignalReadonlyComputed} from current value */
    view(): SignalReadonlyComputed<Value>;
    /** Creates {@link SignalReadonlyComputed} that gets value from {@link field} */
    view<Field extends keyof Value>(field: Field): SignalReadonlyComputed<Value[Field]>;
    view<F1 extends keyof Value, F2 extends keyof Value[F1]>(field1: F1, field2: F2): SignalReadonlyComputed<Value[F1][F2]>;
    view<F1 extends keyof Value, F2 extends keyof Value[F1], F3 extends keyof Value[F1][F2]>(
      field1: F1,
      field2: F2,
      field3: F3,
    ): SignalReadonlyComputed<Value[F1][F2][F3]>;
    view<F1 extends keyof Value, F2 extends keyof Value[F1], F3 extends keyof Value[F1][F2], F4 extends keyof Value[F1][F2][F3]>(
      field1: F1,
      field2: F2,
      field3: F3,
      field4: F4,
    ): SignalReadonlyComputed<Value[F1][F2][F3][F4]>;
    view<
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
    ): SignalReadonlyComputed<Value[F1][F2][F3][F4][F5]>;
    view<Value>(...fields: [PropertyKey, PropertyKey, PropertyKey, PropertyKey, PropertyKey, ...PropertyKey[]]): SignalReadonlyComputed<Value>;
  }
}
const views = new Stamper((signal: SignalReadonly<unknown>) => {
  const map = Map.withFabric(
    (field) =>
      new SmartWeakRef(
        () =>
          new SignalReadonlyComputed(() => {
            const value = signal.get();
            return Reflect.get(value as never, field as never, value);
          }),
      ),
  );
  map.set(same, new SmartWeakRef(() => new SignalReadonlyComputed(() => signal.get())) as never);
  return map;
});
defineMethod(SignalReadonly.prototype, "view", function view(this: SignalReadonly<unknown>, ...names: PropertyKey[]) {
  let signal: SignalReadonlyComputed<unknown> = this as never;
  if (names.length === 0) names = [same as never];
  while (names.length > 0) {
    signal = views.emplace(signal).emplace(names.shift()).emplace() as never;
  }
  return signal;
} as never);

declare module "./signal-readonly" {
  interface SignalReadonly<Value> {
    /** Creates {@link SignalWritableComputed} that wraps value in {@link field} */
    field<Field extends WritableKeys<Value>>(field: Field): SignalWritableComputed<Value[Field]>;
    field<F1 extends WritableKeys<Value>, F2 extends WritableKeys<Value[F1]>>(field1: F1, field2: F2): SignalWritableComputed<Value[F1][F2]>;
    field<F1 extends WritableKeys<Value>, F2 extends WritableKeys<Value[F1]>, F3 extends WritableKeys<Value[F1][F2]>>(
      field1: F1,
      field2: F2,
      field3: F3,
    ): SignalWritableComputed<Value[F1][F2][F3]>;
    field<
      F1 extends WritableKeys<Value>,
      F2 extends WritableKeys<Value[F1]>,
      F3 extends WritableKeys<Value[F1][F2]>,
      F4 extends WritableKeys<Value[F1][F2][F3]>,
    >(
      field1: F1,
      field2: F2,
      field3: F3,
      field4: F4,
    ): SignalWritableComputed<Value[F1][F2][F3][F4]>;
    field<
      F1 extends WritableKeys<Value>,
      F2 extends WritableKeys<Value[F1]>,
      F3 extends WritableKeys<Value[F1][F2]>,
      F4 extends WritableKeys<Value[F1][F2][F3]>,
      F5 extends WritableKeys<Value[F1][F2][F3][F4]>,
    >(
      field1: F1,
      field2: F2,
      field3: F3,
      field4: F4,
      field5: F5,
    ): SignalWritableComputed<Value[F1][F2][F3][F4][F5]>;
    field<Value>(...fields: [PropertyKey, PropertyKey, PropertyKey, PropertyKey, PropertyKey, ...PropertyKey[]]): SignalWritableComputed<Value>;
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
defineMethod(SignalReadonly.prototype, "field", function field(this: SignalReadonly<unknown>, ...names: PropertyKey[]) {
  let signal: SignalWritableComputed<unknown> = fields.emplace(this).emplace(names.shift()).emplace() as never;
  while (names.length > 0) {
    signal = fields.emplace(signal).emplace(names.shift()).emplace() as never;
  }
  return signal;
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
    get(...fields: [PropertyKey, PropertyKey, PropertyKey, PropertyKey, PropertyKey, ...PropertyKey[]]): unknown;
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
    set(next: NoInfer<Value>): void;
    set<Field extends WritableKeys<Value>>(next: NoInfer<Value[Field]>, field: Field): void;
    set<F1 extends WritableKeys<Value>, F2 extends WritableKeys<Value[F1]>>(next: NoInfer<Value[F1][F2]>, field1: F1, field2: F2): void;
    set<F1 extends WritableKeys<Value>, F2 extends WritableKeys<Value[F1]>, F3 extends WritableKeys<Value[F1][F2]>>(
      next: NoInfer<Value[F1][F2][F3]>,
      field1: F1,
      field2: F2,
      field3: F3,
    ): void;
    set<
      F1 extends WritableKeys<Value>,
      F2 extends WritableKeys<Value[F1]>,
      F3 extends WritableKeys<Value[F1][F2]>,
      F4 extends WritableKeys<Value[F1][F2][F3]>,
    >(
      next: NoInfer<Value[F1][F2][F3][F4]>,
      field1: F1,
      field2: F2,
      field3: F3,
      field4: F4,
    ): void;
    set<
      F1 extends WritableKeys<Value>,
      F2 extends WritableKeys<Value[F1]>,
      F3 extends WritableKeys<Value[F1][F2]>,
      F4 extends WritableKeys<Value[F1][F2][F3]>,
      F5 extends WritableKeys<Value[F1][F2][F3][F4]>,
    >(
      next: NoInfer<Value[F1][F2][F3][F4][F5]>,
      field1: F1,
      field2: F2,
      field3: F3,
      field4: F5,
      field5: F5,
    ): void;
    set(next: unknown, ...params: [PropertyKey, PropertyKey, PropertyKey, PropertyKey, PropertyKey, ...PropertyKey[]]): void;
  }
}
defineMethod(SignalWritable.prototype, "set", function set<Value>(this: SignalWritable<Value>, value: unknown, ...fields: PropertyKey[]) {
  let signal: SignalWritable<unknown> = this as never;
  while (fields.length > 0) {
    signal = signal.field(fields.shift() as never);
  }
  signal._set(value);
});

export {};
