import { describe, expect, test } from "@jest/globals";
import { BehaviorSubject, of } from "rxjs";

import {
  createReactRxStore,
  isImmediateCompleted,
  isReactRxStore,
} from "../react-rx-store";

describe("isReactRxStore, without store", () => {
  const value = Symbol("test-value") as symbol;
  const subject = new BehaviorSubject(value);
  const createStore = () => {
    const prototype = Object.create(subject);
    prototype.reactSubscription = () => {};
    prototype.getValue = () => {};
    prototype.next = () => {};
    const store = Object.create(prototype);
    store.reactSubscription = () => {};
    store.getValue = () => {};
    store.next = () => {};
    return store;
  };

  test("with store like object", () => {
    expect(isReactRxStore(createStore())).toBe(true);
  });

  test("with invalid reactSubscription", () => {
    const store = createStore();
    store.reactSubscription = 1;
    expect(isReactRxStore(store)).toBe(false);
  });

  test("with prototype reactSubscription", () => {
    const store = createStore();
    delete store.reactSubscription;
    expect(isReactRxStore(store)).toBe(false);
  });

  // eslint-disable-next-line jest/no-disabled-tests -- no need in binding `getValue`
  test.skip("with invalid getValue", () => {
    const store = createStore();
    store.getValue = 1;
    expect(isReactRxStore(store)).toBe(false);
  });

  // eslint-disable-next-line jest/no-disabled-tests -- no need in binding `getValue`
  test.skip("with prototype getValue", () => {
    const store = createStore();
    delete store.getValue;
    expect(isReactRxStore(store)).toBe(false);
  });

  // eslint-disable-next-line jest/no-disabled-tests -- no need in binding `next`
  test.skip("with invalid next", () => {
    const store = createStore();
    store.next = 1;
    expect(isReactRxStore(store)).toBe(false);
  });

  // eslint-disable-next-line jest/no-disabled-tests -- no need in binding `next`
  test.skip("with prototype next", () => {
    const store = createStore();
    delete store.next;
    expect(isReactRxStore(store)).toBe(false);
  });

  test("with plain subject", () => {
    expect(isReactRxStore(subject)).toBe(false);
  });
});

describe("isImmediateCompleted", () => {
  const value = Symbol("test-value") as symbol;

  test("with continued", () => {
    const source = new BehaviorSubject(value);
    expect(isImmediateCompleted(source)).toBe(false);
  });

  test("with completed with value", () => {
    const source = of(value);
    expect(isImmediateCompleted(source)).toBe(false);
  });

  test("with completed without value", () => {
    const source = new BehaviorSubject(value);
    source.complete();
    expect(isImmediateCompleted(source)).toBe(true);
  });
});

describe("createReactRxStore", () => {
  const value = Symbol("test-value") as symbol;
  const subject = new BehaviorSubject(value);
  const subjectCompleted = new BehaviorSubject(value);
  subjectCompleted.complete();

  test("create, with value", () => {
    const store = createReactRxStore(value);
    expect(isReactRxStore(store)).toBe(true);
    expect(store.getValue()).toBe(value);
  });

  test("create, with value fabric", () => {
    const store = createReactRxStore(() => value);
    expect(isReactRxStore(store)).toBe(true);
    expect(store.getValue()).toBe(value);
  });

  test("create, with subject", () => {
    const store = createReactRxStore(subject);
    expect(isReactRxStore(store)).toBe(true);
    expect(store.getValue()).toBe(value);
  });

  test("create, with subject fabric", () => {
    const store = createReactRxStore(() => subject);
    expect(isReactRxStore(store)).toBe(true);
    expect(store.getValue()).toBe(value);
  });

  test("create, with completed subject", () => {
    const store = createReactRxStore(() => subject);
    expect(isReactRxStore(store)).toBe(true);
    expect(store.getValue()).toBe(value);
  });

  test("create, with store", () => {
    const testStore = createReactRxStore(value);
    const store = createReactRxStore(testStore);
    expect(store).toBe(testStore);
  });

  test("create, with store fabric", () => {
    const testStore = createReactRxStore(value);
    const store = createReactRxStore(() => testStore);
    expect(store).toBe(testStore);
  });

  test("create, with completed store", () => {
    const testStore = createReactRxStore(value);
    testStore.complete();
    const store = createReactRxStore(testStore);
    expect(store).not.toBe(testStore);
    expect(isReactRxStore(store)).toBe(true);
    expect(isImmediateCompleted(store)).toBe(false);
    expect(store.getValue()).toBe(value);
  });
});
