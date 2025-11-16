import { liftContext } from "@anion155/shared";
import { Initializer } from "@anion155/shared/actions/initializer";
import type { AnyEventsMap } from "@anion155/shared/event-emitter";
import { EventEmitter } from "@anion155/shared/event-emitter";
import { immidiateScheduler } from "@anion155/shared/scheduler";

export class Resource<Value, Events extends AnyEventsMap<never> = Record<never, unknown>> extends EventEmitter<
  Extend<Events, { initialized(value: Value): void; disposed(): void }>
> {
  get #emitter() {
    return this as EventEmitter<{ initialized(value: Value): void; disposed(): void }>;
  }

  readonly #initializer: Initializer<[], Value>;
  constructor(initialize: (stack: AsyncDisposableStack) => Promise<Value> | Value) {
    super(immidiateScheduler);
    this.#initializer = new Initializer(
      liftContext(async ({ stack }) => {
        stack.append(() => this.#emitter.emit("disposed"));
        const value = await initialize(stack);
        this.#emitter.emit("initialized", value);
        return value;
      }),
    );
  }

  get initializer() {
    return this.#initializer;
  }
  async initialize() {
    await this.initializer.run();
    return this;
  }
  async dispose() {
    await this.initializer.dispose();
  }
  [Symbol.asyncDispose]() {
    return this.dispose();
  }
}
