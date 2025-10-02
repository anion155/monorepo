export type Scheduler<SchedulerId> = {
  schedule(fn: () => void): SchedulerId;
  cancel(id: SchedulerId): void;
};

const createScheduler = (schedule: (fn: () => void) => void): Scheduler<() => void> => {
  return {
    schedule: (fn) => {
      let waiting = true;
      schedule(() => waiting && fn());
      return () => (waiting = false);
    },
    cancel: (cancel) => cancel(),
  };
};

export const immidiateScheduler: Scheduler<unknown> = {
  schedule: (fn) => fn(),
  cancel: () => {},
};

export const microtaskScheduler: typeof globalThis extends { queueMicrotask: unknown } ? ReturnType<typeof createScheduler> : undefined = (
  "queueMicrotask" in globalThis ? createScheduler(queueMicrotask) : undefined
) as never;

export const rafScheduler: typeof globalThis extends { requestAnimationFrame: unknown } ? Scheduler<number> : undefined = (
  "requestAnimationFrame" in globalThis
    ? ({
        schedule: requestAnimationFrame,
        cancel: cancelAnimationFrame,
      } as Scheduler<number>)
    : undefined
) as never;

export const timeoutScheduler: Scheduler<ReturnType<typeof setTimeout>> = {
  schedule: setTimeout,
  cancel: clearTimeout,
};

export const promiseScheduler = createScheduler((fn) => {
  void Promise.resolve().then(fn);
});

export const asyncScheduler = microtaskScheduler ?? promiseScheduler;
