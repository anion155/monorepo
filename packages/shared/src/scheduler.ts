/** Generic definition of scheduler that can be used to schedule some function */
export type Scheduler = {
  schedule(fn: () => void): void;
};

/** Generic definition of scheduler that can be used to schedule and cancel some function */
export type SchedulerCancelable<SchedulerId> = {
  schedule(fn: () => void): SchedulerId;
  cancel(id: SchedulerId): void;
};

/** Creates CancelableScheduler from any Scheduler. */
export const createCancelableScheduler = (scheduler: Scheduler): SchedulerCancelable<() => void> => {
  return {
    schedule: (fn) => {
      let waiting = true;
      scheduler.schedule(() => waiting && fn());
      return () => (waiting = false);
    },
    cancel: (cancel) => cancel(),
  };
};

/** Immidiate scheduler, calls {@link fn} during it's own execution. */
export const immidiateScheduler: SchedulerCancelable<void> = {
  schedule: (fn) => (fn(), undefined),
  cancel: () => {},
};

/**
 * Schedule {@link fn} to be run in the next microtask.
 * Uses {@link queueMicrotask} api, so it won't be available unless it is present.
 */
export const microtaskScheduler: typeof globalThis extends { queueMicrotask: unknown } ? ReturnType<typeof createCancelableScheduler> : undefined = (
  "queueMicrotask" in globalThis ? createCancelableScheduler({ schedule: (fn) => globalThis.queueMicrotask(fn) }) : undefined
) as never;

/**
 * Schedule {@link fn} to be run on next animation frame.
 * Uses {@link requestAnimationFrame} api, so it won't be available unless it is present.
 */
export const rafScheduler: typeof globalThis extends { requestAnimationFrame: unknown } ? SchedulerCancelable<number> : undefined = (
  "requestAnimationFrame" in globalThis
    ? ({
        schedule: (fn) => globalThis.requestAnimationFrame(fn),
        cancel: (id) => globalThis.cancelAnimationFrame(id),
      } as SchedulerCancelable<number>)
    : undefined
) as never;

/** Creates scheduler for specific {@link timeout}. */
export const createTimeoutScheduler = (timeout: number): SchedulerCancelable<ReturnType<typeof setTimeout>> => ({
  schedule: (fn) => setTimeout(fn, timeout),
  cancel: clearTimeout,
});

/** Schedule {@link fn} to be run on next macrotask ({@link setTimeout}). */
export const timeoutScheduler = createTimeoutScheduler(0);

/** Schedule {@link fn} to be run in the next microtask. */
export const promiseScheduler = createCancelableScheduler({
  schedule: (fn) => {
    void Promise.resolve().then(fn);
  },
});

/** Schedule {@link fn} to be run in the next microtask. */
export const asyncScheduler = microtaskScheduler ?? promiseScheduler;
