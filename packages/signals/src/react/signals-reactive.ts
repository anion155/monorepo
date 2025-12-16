import { DeveloperError } from "@anion155/shared";
import type { ReactNode } from "react";

import { SignalEffect } from "../effect";
import { context } from "../internals";
import { useSignalsReactive } from "./use-signals-reactive";

/**
 * Functional HOC that allows you to subscribe to values that was used during render call.
 *
 * @example
 *  const state = signalState(5);
 *  const Counter = () => {
 *    const effect = signalsReactive.getEffect();
 *    return (
 *      <div>
 *        <div>{state.get()}</div> // on first render will subscribe to state changes
 *        <button onPress={() => state.set(state.get() - 1)}>-</button>
 *        <button onPress={() => state.set(state.get() + 1)}>+</button>
 *      </div>
 *    );
 *  };
 *  const _Counter = signalsReactive(Counter); // sets up signals context, that would be cleaned up on render finish
 *  export { _Counter as Counter };
 */
export function signalsReactive<Render extends Functor<[props: never], ReactNode>>(
  render: Render,
  sync?: boolean,
): Omit<Render, ""> & Functor<[props: InferFunctor<Render>["Params"][0]], InferFunctor<Render>["Result"]> {
  const SignalsComponent = (props: InferFunctor<Render>["Params"][0]) => {
    using _signals = useSignalsReactive(sync);
    return render(props);
  };
  // @ts-expect-error(2704)
  delete SignalsComponent.name;
  Object.setPrototypeOf(SignalsComponent, render);
  return SignalsComponent as never;
}
signalsReactive.getEffect = function getEffect() {
  const signalsContext = context.current();
  if (signalsContext.type !== "subscription") throw new DeveloperError("getEffect() must be calle");
  if (!signalsContext.render) return undefined;
  if (!(signalsContext.listener instanceof SignalEffect)) return undefined;
  return signalsContext.listener;
};
