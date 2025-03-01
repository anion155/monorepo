import "@anion155/shared/global";

import { updateProperty } from "@anion155/shared";

import { internals } from "./internals";

export interface Signal extends Disposable {}
export class Signal {
  constructor() {
    DisposableStack.stamper.stamp(this).append(() => {
      if (internals.dependencies.is(this)) {
        internals.dependencies.get(this).forEach((dependency) => internals.unbind(this, dependency));
      }
      if (internals.dependents.is(this)) {
        internals.dependents.get(this).forEach((dependent) => dependent[Symbol.dispose]());
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
