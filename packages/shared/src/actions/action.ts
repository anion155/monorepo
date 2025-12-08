import { AbortError } from "../abort";
import { createErrorClass, DeveloperError } from "../errors";
import { EventEmitter } from "../event-emitter";
import { compare } from "../misc";
import { isPromise } from "../promise";

export type ActionContext = {
  action: Action<unknown[], unknown>;
  signal: AbortSignal;
};

export type ActionCallback<Params extends unknown[], Result> = (this: ActionContext, ...params: Params) => Promise<Result> | Result;

export type ActionRunningStateIdle = { status: "idle" };
export type ActionRunningStatePending<Params extends unknown[], Result> = {
  status: "pending";
  params: Params;
  result?: Promise<Result> | Result;
  promise?: Promise<Result>;
  abort: (reason?: unknown) => void;
};
export type ActionRunningState<Params extends unknown[], Result> = ActionRunningStateIdle | ActionRunningStatePending<Params, Result>;

export type ActionResultStateRejected<Params extends unknown[]> = { status: "rejected"; params: Params; reason: unknown };
export type ActionResultStateResolved<Params extends unknown[], Result> = {
  status: "resolved";
  params: Params;
  value: Result;
};
export type ActionResultState<Params extends unknown[], Result> = ActionResultStateRejected<Params> | ActionResultStateResolved<Params, Result>;

/**
 * Action wrapper, that stores action's execution state.
 * @example
 *  const action = new Action(() => Promise.wait());
 *  let state = action.state;
 *  action.on('updated', () => {
 *    state = action.state;
 *  });
 *  action.run();
 */
export class Action<Params extends unknown[], Result> extends EventEmitter<{
  running(running: Readonly<ActionRunningState<Params, Result>>): void;
  result(result: Readonly<ActionResultState<Params, Result>> | undefined): void;
  updated(state: Readonly<ActionRunningState<Params, Result>> | Readonly<ActionResultState<Params, Result>>): void;
  resolved(value: Result): void;
  rejected(reason: unknown): void;
  finally(): void;
}> {
  #callback: ActionCallback<Params, Result>;
  #running: ActionRunningState<Params, Result> = { status: "idle" };
  #resolved(value: Result, params: Params) {
    this.#running = { status: "idle" };
    this.emit("running", this.#running);
    this.#result = { status: "resolved", params, value };
    this.emit("result", this.#result);
    this.emit("updated", this.state);
    this.emit("resolved", value);
    this.emit("finally");
  }
  #rejected(reason: unknown, params: Params) {
    this.#running = { status: "idle" };
    this.emit("running", this.#running);
    this.#result = { status: "rejected", params, reason };
    this.emit("result", this.#result);
    this.emit("updated", this.state);
    this.emit("rejected", reason);
    this.emit("finally");
  }
  #result: ActionResultState<Params, Result> | undefined = undefined;

  get running(): Readonly<ActionRunningState<Params, Result>> {
    return this.#running;
  }
  get result(): Readonly<ActionResultState<Params, Result>> | undefined {
    return this.#result;
  }
  get state(): Readonly<ActionRunningState<Params, Result>> | Readonly<ActionResultState<Params, Result>> {
    if (this.#running.status === "pending" || !this.#result) return this.#running;
    return this.#result;
  }

  constructor(callback: ActionCallback<Params, Result>) {
    super();
    this.#callback = callback;
  }

  run(...params: Params) {
    if (this.#running.status === "pending") this.cancel();
    let done = false;
    try {
      const controller = new AbortController();
      const abort = (reason: unknown = new AbortError()) => {
        if (done) return;
        done = true;
        controller.abort(reason);
        this.#rejected(reason, params);
      };
      this.#running = { status: "pending", params, abort };
      const result = this.#callback.call({ action: this, signal: controller.signal }, ...params);
      this.#running.result = result;
      let promise = isPromise(result) ? result : Promise.resolve(result);
      promise = promise.then(
        (value) => {
          if (!done) {
            done = true;
            this.#resolved(value, params);
          }
          return value;
        },
        (reason) => {
          if (!done) {
            done = true;
            this.#rejected(reason, params);
          }
          throw reason;
        },
      );
      this.#running.promise = promise;
      this.emit("running", this.#running);
      this.emit("updated", this.state);
      return promise;
    } catch (reason) {
      done = true;
      this.#rejected(reason, params);
      throw reason;
    }
  }

  cancel(reason?: unknown) {
    if (this.#running.status === "pending") this.#running.abort(reason);
  }
}

/**
 * Cached action wrapper, that stores action's execution state.
 * @example
 *  const action = new CachedAction(() => Promise.wait());
 *  const result1 = action.run();
 *  const result2 = action.run();
 *  expect(result1).toBe(result2);
 */
export class CachedAction<Params extends unknown[], Result> extends Action<Params, Result> {
  run(...params: Params) {
    if (this.running.status === "pending") {
      if (!this.running.promise) throw new InvalidActionState();
      if (compare(this.running.params, params)) return this.running.promise;
    } else if (this.result?.status === "resolved") {
      if (compare(this.result.params, params)) return Promise.resolve(this.result.value);
    }
    return super.run(...params);
  }
}

export class InvalidActionState extends createErrorClass("InvalidActionState", "Action is in invalid state", DeveloperError) {}
