import { Dependency, Dependent } from "@anion155/shared";

import { Signal } from "../signal";

export interface SignalListener extends Signal, Dependent {
  [Symbol.invalidate](): void;
}
export interface SignalReadonlyValue<Value> extends Signal, Dependency {
  peak(): Value;
  get(): Value;
}
export interface SignalWritableValue<Value> extends Signal, SignalReadonlyValue<Value> {
  set(value: Value): void;
}
export type SignalValue<Value> = SignalReadonlyValue<Value> | SignalWritableValue<Value>;
