import { hasOwnProperty } from "@anion155/react-hooks/utils";
import type { Observable } from "rxjs";
import { BehaviorSubject } from "rxjs";

import { EmptyValueError } from "./errors";
import { getImmediate } from "./get-immediate";

export interface ReactRxStore<T> extends BehaviorSubject<T> {
  reactSubscription: (onStoreChange: () => void) => () => void;
}

export function isReactRxStore<T>(
  subject: BehaviorSubject<T>
): subject is ReactRxStore<T> {
  const obj = subject as unknown;
  return (
    hasOwnProperty(obj, "reactSubscription") &&
    obj.reactSubscription instanceof Function
  );
}

export function isImmediateCompleted<T>(source: Observable<T>): boolean {
  const result = getImmediate(source);
  return (
    !!result && "error" in result && result.error instanceof EmptyValueError
  );
}

export type ReactRxStoreInput<T> =
  | T
  | BehaviorSubject<T>
  | { (): T | BehaviorSubject<T> };

function createStoreSubject<T>(input: ReactRxStoreInput<T>) {
  const value = input instanceof Function ? input() : input;
  if (!(value instanceof BehaviorSubject)) {
    return new BehaviorSubject(value);
  }
  if (isImmediateCompleted(value)) {
    return new BehaviorSubject(value.getValue());
  }
  return value;
}

export function createReactRxStore<T>(
  input: ReactRxStoreInput<T>
): ReactRxStore<T> {
  const subject = createStoreSubject(input);
  if (isReactRxStore(subject)) return subject;

  const store: ReactRxStore<T> = Object.create(subject);
  store.reactSubscription = (onStoreChange) => {
    const subscription = store.subscribe(onStoreChange);
    return () => subscription.unsubscribe();
  };
  return store;
}
