import { runGC } from "./gc";

/** Allow developer to wait until value created by {@link fabric} is reclaimed. */
export class Waiter {
  #registry: FinalizationRegistry<unknown>;
  #waiting = true;
  #ref: WeakRef<object>;

  constructor(fabric: () => object) {
    this.#registry = new FinalizationRegistry(() => {
      this.#waiting = false;
    });
    this.#ref = new WeakRef(fabric());
    this.#registry.register(this.#ref.deref()!, undefined);
    fabric = null as never;
  }

  deref() {
    return this.#ref.deref();
  }

  async await() {
    while (this.#waiting) await runGC();
  }
}
