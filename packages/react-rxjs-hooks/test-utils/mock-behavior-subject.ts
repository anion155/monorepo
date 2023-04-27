import { jest } from "@jest/globals";
import type { BehaviorSubject } from "rxjs";

import { mockObservable } from "./mock-observable";

export function mockBehaviorSubject<T>(subject: BehaviorSubject<T>) {
  const subs = mockObservable(subject);

  const getValue: jest.Mock<BehaviorSubject<T>["getValue"]> = jest.fn();
  const next: jest.Mock<BehaviorSubject<T>["next"]> = jest.fn();
  const complete: jest.Mock<BehaviorSubject<T>["complete"]> = jest.fn();

  /* eslint-disable no-param-reassign -- intentional */
  getValue.mockImplementation(subject.getValue);
  subject.getValue = (...subArgs: never[]) => getValue.apply(subject, subArgs);

  next.mockImplementation(subject.next);
  subject.next = (...subArgs: never[]) => next.apply(subject, subArgs);

  complete.mockImplementation(subject.complete);
  subject.complete = (...subArgs: never[]) => complete.apply(subject, subArgs);
  /* eslint-enable no-param-reassign */

  return { ...subs, getValue, next, complete };
}
