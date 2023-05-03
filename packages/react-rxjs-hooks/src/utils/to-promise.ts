import type { CancelablePromise } from "@anion155/react-hooks/utils";
import { cancelablePromise } from "@anion155/react-hooks/utils";
import type { Observable } from "rxjs";
import { Subscription } from "rxjs";

import { assert } from "./bundled";
import { EmptyValueError } from "./errors";

export type PromiseSubscriber<T, U = T> = (
  source: Observable<T>,
  resolve: (value: U) => void,
  reject: (error: unknown) => void
) => Subscription;
export type PromiseSubscribed<T> = CancelablePromise<T> & {
  subscription: Subscription;
};

export function toPromise<T>(
  source: Observable<T>
): PromiseSubscribed<T | undefined>;
export function toPromise<T, U>(
  source: Observable<T>,
  subscriber: PromiseSubscriber<T, U>
): PromiseSubscribed<U>;
export function toPromise<T, U>(
  source: Observable<T>,
  subscriber: PromiseSubscriber<T, U> = toPromise.defaultSubscriber() as never
): PromiseSubscribed<U> {
  let subscription: Subscription | undefined;
  const promise = cancelablePromise<U>((resolve, reject) => {
    subscription = subscriber(source, resolve, reject);
    return () => subscription?.unsubscribe();
  });
  assert(
    subscription && subscription instanceof Subscription,
    "DeveloperError: subscription is not created yet, should never happen"
  );
  subscription.add(() => promise.cancel());

  return Object.assign(promise, { subscription });
}

// eslint-disable-next-line @typescript-eslint/no-namespace -- intentional
export namespace toPromise {
  export function first<T>(): PromiseSubscriber<T> {
    return (source, resolve, reject) => {
      return source.subscribe({
        next: resolve,
        error: reject,
        complete: () => reject(new EmptyValueError()),
      });
    };
  }

  export function last<T>(): PromiseSubscriber<T> {
    return (source, resolve, reject) => {
      let store: { value: T } | undefined;
      return source.subscribe({
        next: (value) => {
          store = { value };
        },
        error: reject,
        complete: () => {
          if (!store) {
            reject(new EmptyValueError());
          } else {
            resolve(store.value);
          }
        },
      });
    };
  }

  export function withInitial<T, U, I>(
    initial: I,
    subscriber: PromiseSubscriber<T, U>
  ): PromiseSubscriber<T, U | I> {
    return (source, resolve, reject) => {
      return subscriber(source, resolve, (error) => {
        if (error instanceof EmptyValueError) {
          resolve(initial);
        } else {
          reject(error);
        }
      });
    };
  }

  export function throttle<T, U>(
    subscriber: PromiseSubscriber<T, U>
  ): PromiseSubscriber<T, U> {
    let subscription: Subscription | undefined;
    return (source, resolve, reject) => {
      subscription?.unsubscribe();
      subscription = subscriber(source, resolve, reject);
      return subscription;
    };
  }

  export function defaultSubscriber<T>() {
    return toPromise.withInitial(undefined, toPromise.last<T>());
  }
}
