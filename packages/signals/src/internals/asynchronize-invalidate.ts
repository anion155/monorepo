export type PromiseCancelable<T> = Promise<T> & { cancel(reason?: unknown): void };
export function asynchronizeInvalidate<Target extends { [Symbol.invalidate](): void }>(target: Target) {
  const method = target[Symbol.invalidate];
  let state: PromiseCancelable<void> | undefined;
  target[Symbol.invalidate] = () => {
    if (state) return;
    const controller = new AbortController();
    const promise = Promise.resolve().then(() => {
      if (controller.signal.aborted) return;
      state = undefined;
      method.call(target);
    });
    state = Object.assign(promise, {
      cancel: (reason?: unknown) => {
        state = undefined;
        controller.abort(reason);
      },
    });
  };
  return { sync: method.bind(target), cancel: (reason?: unknown) => state?.cancel(reason) };
}
