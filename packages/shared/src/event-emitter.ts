import type { Scheduler } from "./scheduler";
import { asyncScheduler } from "./scheduler";

export class EventEmitter<Events extends Record<string, (...params: never) => void> = Record<string, (...params: unknown[]) => void>> {
  #listeners = new Map<keyof Events, Set<(...params: never) => void>>();
  #scheduler: Scheduler;

  /**
   * Typesafe eventemitter.
   * @param [scheduler=asyncScheduler] custom Scheduler, uses {@link asyncScheduler} by default.
   */
  constructor(scheduler: Scheduler = asyncScheduler) {
    this.#scheduler = scheduler;
  }

  /**
   * Subscribes {@link lintener} to {@link event}.
   * @returns subscription destructor.
   */
  on<Event extends keyof Events>(event: Event, listener: (...params: Parameters<Events[Event]>) => void) {
    if (this.#listeners.has(event)) {
      this.#listeners.get(event)?.add(listener);
    } else {
      this.#listeners.set(event, new Set([listener]));
    }
    const off = () => {
      this.#listeners.get(event)?.delete(listener);
    };
    return Object.assign(off, { [Symbol.dispose]: off });
  }

  /** Unsubscribes {@link lintener} from {@link event}. */
  off<Event extends keyof Events>(event: Event, listener: (...params: Parameters<Events[Event]>) => void) {
    this.#listeners.get(event)?.delete(listener);
  }

  /** Emits {@link event}. Uses {@link scheduler} to schedule listeners. */
  emit<Event extends keyof Events>(event: Event, ...params: Parameters<Events[Event]>) {
    const listeners = this.#listeners.get(event)?.values().toArray();
    if (!listeners) return;
    this.#scheduler.schedule(() => listeners.forEach((listener) => listener(...(params as never))));
  }

  /** Object that returns emit function for field name as event. */
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
