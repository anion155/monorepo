import { jest } from "@jest/globals";
import type { Observable, Subscription } from "rxjs";

export function mockObservable<T>(source: Observable<T>) {
  const subscribeSpy: jest.Mock<Observable<T>["subscribe"]> = jest.fn();
  const unsubscribeSpy: jest.Mock<Subscription["unsubscribe"]> = jest.fn();

  const { subscribe } = source;
  /* eslint-disable no-param-reassign, @typescript-eslint/no-explicit-any -- intentional */
  source.subscribe = subscribeSpy as any;
  subscribeSpy.mockImplementation((...subArgs) => {
    const subscription = subscribe.apply(source, subArgs as any);
    const { unsubscribe } = subscription;
    subscription.unsubscribe = unsubscribeSpy;
    unsubscribeSpy.mockImplementation((...unsubArgs) => {
      return unsubscribe.apply(subscription, unsubArgs);
    });
    return subscription;
  });
  /* eslint-enable no-param-reassign, @typescript-eslint/no-explicit-any */

  return { subscribe: subscribeSpy, unsubscribe: unsubscribeSpy };
}
