export type EventEmitterScheduler = (fn: () => void) => void;

export class EventEmitter<Events extends Record<string, (...params: never) => void> = Record<string, (...params: unknown[]) => void>> {
  #listeners = new Map<keyof Events, Set<(...params: never) => void>>();

  constructor(private readonly scheduler: EventEmitterScheduler = EventEmitter.asyncScheduler) {}

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
    this.scheduler(() => listeners.forEach((listener) => listener(...(params as never))));
  }

  static readonly immidiateScheduler: EventEmitterScheduler = (fn) => fn();
  static readonly microtaskScheduler: EventEmitterScheduler = queueMicrotask;
  static readonly promiseScheduler: EventEmitterScheduler = (fn) => (Promise.resolve().then(fn), undefined);
  static readonly timeoutScheduler: EventEmitterScheduler = (fn) => setTimeout(fn, 0);

  static get asyncScheduler() {
    return EventEmitter.microtaskScheduler;
  }
  static get syncScheduler() {
    return EventEmitter.immidiateScheduler;
  }
}
