import type { Dependency, Dependent } from "@anion155/shared";

import type { Signal } from "./signal";

export interface SignalDependent extends Signal, Dependent {}
export interface SignalListener extends SignalDependent {
  invalidate(): void;
}
export interface SignalDependency extends Signal, Dependency {}
export interface SignalValue<Value> extends SignalDependency {
  peak(): Value;
}
export type SignalDependentDependency = Signal & Dependent & Dependency;
