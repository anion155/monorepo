import { assert } from "./bundled";

export class CanceledError extends Error {}

export type CancelablePromise<T> = Promise<T> & { cancel: () => void };
export type CancelState = { canceled: boolean };
export type CancelablePromiseExecutor<T> = (
  resolve: (value: T | PromiseLike<T>) => void,
  reject: (reason?: unknown) => void,
  state: Readonly<CancelState>
) => void | { (): void };

export function cancelablePromise<T>(
  executor: CancelablePromiseExecutor<T>
): CancelablePromise<T> {
  let cancel: { (): void } | undefined;
  const promise = new Promise<T>((resolve, reject) => {
    const state: CancelState = { canceled: false };
    const onCanceled = executor(resolve, reject, state);
    cancel = () => {
      state.canceled = true;
      onCanceled?.();
      reject(new CanceledError());
    };
  });
  assert(
    cancel,
    "DeveloperError: cancel is not assigned yet, should never happen"
  );

  return Object.assign(promise, { cancel });
}
