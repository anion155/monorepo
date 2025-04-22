import "@anion155/shared/global";

import type { WithToStringTag } from "@anion155/shared";
import { defineToStringTag, updateProperty } from "@anion155/shared";

import { depends } from "./internals";

export interface Signal extends Disposable, WithToStringTag {}
/** Base class for all signal */
export class Signal {
  constructor() {
    DisposableStack.stamper.stamp(this).append(() => {
      if (depends.dependencies.has(this)) {
        depends.dependencies.get(this).forEach((dependency) => depends.unbind(this, dependency));
      }
      if (depends.dependents.has(this)) {
        depends.dependents.get(this).forEach((listener) => listener[Symbol.dispose]());
      }
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
defineToStringTag(Signal);
