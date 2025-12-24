import { createErrorClass } from "./errors";
import { EventEmitter } from "./event-emitter";
import { Maybe } from "./maybe";
import type { Scheduler } from "./scheduler";
import { createTimeoutScheduler, immidiateScheduler, type SchedulerCancelable } from "./scheduler";

/**
 * Loop controller, simmilar to {@link setInterval}, but can be used with any cancelable scheduler
 *
 * @example
 *  const loop = new Loop(1000, () => {
 *    console.log("print once in a second");
 *  });
 *  loop.on('tick', () => {
 *    console.log("also print once in a second");
 *  });
 *  loop.start(); // don't want to wait
 *  loop.stop(); // ok, thats all for today
 */
export class Loop<Result extends void | Promise<void>> extends EventEmitter<{
  tick(signal: AbortSignal): void;
  "tick-resolved"(): void;
  error(reason: unknown): void;
}> {
  readonly #scheduller: SchedulerCancelable<unknown> | Scheduler;
  readonly #task: { (signal: AbortSignal): Result extends Promise<unknown> ? Promise<void> : void } | undefined;

  constructor(scheduller: SchedulerCancelable<unknown> | Scheduler | number, task?: (signal: AbortSignal) => Result, dormant = false) {
    super(immidiateScheduler);
    if (scheduller === immidiateScheduler) throw new LoopInvalidScheduler("Can not create Loop with immidiate scheduler");
    this.#scheduller = typeof scheduller === "number" ? (createTimeoutScheduler(scheduller) as never) : scheduller;
    this.#task = task as never;
    if (!dormant) this.start();
  }
  [Symbol.dispose]() {
    this.stop();
  }

  #running: false | { constroller: AbortController; scheduled: unknown } = false;
  get running() {
    return !!this.#running;
  }
  #schedule(constroller: AbortController = new AbortController()) {
    const scheduled = this.#scheduller.schedule(this.#loop);
    this.#running = { constroller, scheduled };
  }
  #loop = () => {
    if (!this.#running) return;
    const constroller = new AbortController();
    Maybe.try(() => {
      this.emit("tick", constroller.signal as never);
      return this.#task?.(constroller.signal);
    })
      .then(() => {
        if (!this.#running) return;
        this.emit("tick-resolved");
        this.#schedule(constroller);
      })
      .catch((reason) => {
        this.stop();
        if (!this.emit("error", reason)) throw reason;
      });
  };
  /** Starts this loop, or restarts it. */
  start() {
    this.stop();
    this.#schedule();
    return this;
  }
  /** Stops this loop. */
  stop() {
    this.#running = false;
    return this;
  }
}

export class LoopInvalidScheduler extends createErrorClass("LoopInvalidScheduler") {}
