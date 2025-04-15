import "@anion155/shared/global";

import { defineToStringTag, updateProperty, WithToStringTag } from "@anion155/shared";

import { depends } from "./internals/internals";

export interface Signal extends Disposable, WithToStringTag {}
export class Signal {
  constructor() {
    DisposableStack.stamper.stamp(this).append(() => {
      if (depends.dependencies.has(this)) {
        depends.dependencies.get(this).forEach((dependency) => depends.unbind(this, dependency));
      }
      if (depends.listeners.has(this)) {
        depends.listeners.get(this).forEach((listener) => listener[Symbol.dispose]());
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
