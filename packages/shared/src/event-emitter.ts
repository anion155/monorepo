import type { SchedulerCancelable } from "./scheduler";
import { asyncScheduler } from "./scheduler";

export class EventEmitter<Events extends Record<string, (...params: never) => void> = Record<string, (...params: unknown[]) => void>> {
  #listeners = new Map<keyof Events, Set<(...params: never) => void>>();

  constructor(private readonly scheduler: SchedulerCancelable<unknown> = asyncScheduler) {}

  on<Event extends keyof Events>(event: Event, listener: (...params: Parameters<Events[Event]>) => void) {
    if (this.#listeners.has(event)) {
      this.#listeners.get(event)?.add(listener);
    } else {
      this.#listeners.set(event, new Set([listener]));
    }
    return () => {
      this.#listeners.get(event)?.delete(listener);
    };
  }

  off<Event extends keyof Events>(event: Event, listener: (...params: Parameters<Events[Event]>) => void) {
    this.#listeners.get(event)?.delete(listener);
  }

  emit<Event extends keyof Events>(event: Event, ...params: Parameters<Events[Event]>) {
    const listeners = this.#listeners.get(event)?.values().toArray();
    if (!listeners) return;
    this.scheduler.schedule(() => listeners.forEach((listener) => listener(...(params as never))));
  }

  events = new Proxy(
    {},
    {
      get: (target, event) => {
        if (!target[event as never]) {
          target[event as never] = ((...params: never) => this.emit(event as never, ...params)) as never;
        }
        return target[event as never];
      },
    },
  ) as Events;
}
