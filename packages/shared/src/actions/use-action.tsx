import type { ComponentProps, DependencyList, FunctionComponent } from "react";
import { use, useEffect, useRef, useState } from "react";

import { compare } from "../misc";
import { useDeepMemo } from "../react/use-deep-memo";
import { useRenderEffect } from "../react/use-render-effect";
import { useStableCallback } from "../react/use-stable-callback";
import type { ActionCallback, ActionRunningStatePending } from "./action";
import { Action, InvalidActionState } from "./action";

export const useActionRunningState = <Params extends unknown[], Result>(action: Action<Params, Result>) => {
  const [state, setState] = useState(action.running);
  useEffect(() => action.on("running", setState), [action]);
  return state;
};

export const useActionResultState = <Params extends unknown[], Result>(action: Action<Params, Result>) => {
  const [state, setState] = useState(action.result);
  useEffect(() => action.on("result", setState), [action]);
  return state;
};

export const useActionState = <Params extends unknown[], Result>(action: Action<Params, Result>) => {
  const [state, setState] = useState(action.state);
  useEffect(() => action.on("updated", setState), [action]);
  return state;
};

export const useActionAwait = <Params extends unknown[], Result>(action: Action<Params, Result>, ...params: Params) => {
  const state = useActionState(action);
  if (state.status === "idle") return use(action.runCached(...params));
  if (state.status === "pending") {
    if (state.promise === undefined) throw new InvalidActionState();
    return use(state.promise);
  }
  if (!compare(state.params, params, 1)) return use(action.runCached(...params));
  if (state.status === "rejected") throw state.reason;
  return state.value;
};

export const useActionCall = <Params extends unknown[], Result>(action: Action<Params, Result>, ...params: Params) => {
  const memoizedParams = useDeepMemo(params);
  useRenderEffect(() => {
    void action.run(...memoizedParams);
    return (action.running as ActionRunningStatePending<Params, Result>).abort;
  }, [action, memoizedParams]);
  return { ...useActionState(action), action };
};

export type MaybeAction<Params extends unknown[], Result> = Action<Params, Result> | ActionCallback<Params, Result>;
export const useCreateAction = <Params extends unknown[], Result>(
  maybeAction: MaybeAction<Params, Result>,
  deps?: DependencyList,
): Omit<Action<Params, Result>, "useAwait"> => {
  const store = useRef<{ action: Action<Params, Result>; deps: DependencyList | undefined } | undefined>(undefined);
  const stableActionCb = useStableCallback(maybeAction as ActionCallback<Params, Result>);
  if (maybeAction instanceof Action) return maybeAction;
  if (!store.current) {
    store.current = { action: new Action(stableActionCb), deps };
  } else if (!compare(store.current.deps, deps, 1)) {
    store.current.action.cancel();
    store.current = { action: new Action(stableActionCb), deps };
  }
  return store.current.action;
};

export const withCreateAction =
  <Params extends unknown[], Result, Prop extends string>(maybeAction: MaybeAction<Params, Result>, propName: Prop) =>
  <Component extends FunctionComponent<{ [P in Prop]: Action<Params, Result> }>>(
    Component: Component,
  ): Omit<Component, never> & {
    (props: Omit<ComponentProps<Component>, Prop>): ReturnType<Component>;
  } => {
    const action = maybeAction instanceof Action ? maybeAction : new Action(maybeAction);
    const Wrapped = (props: Omit<ComponentProps<Component>, Prop>) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return <Component {...(props as any)} {...{ [propName]: action }} />;
    };
    Object.setPrototypeOf(Wrapped, Component);
    const name = `withCreateAction(${Component.displayName ?? Component.name})`;
    Object.defineProperty(Wrapped, "name", { value: name, writable: false, enumerable: true, configurable: true });
    Object.defineProperty(Wrapped, "displayName", { value: name, writable: false, enumerable: true, configurable: true });
    return Wrapped as never;
  };
