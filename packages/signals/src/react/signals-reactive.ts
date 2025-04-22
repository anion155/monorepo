import type { ReactNode } from "react";

import type { SignalEffect } from "../effect";
import { useSignalsReactive } from "./use-signals-reactive";

/**
 * Functional HOC that allows you to subscribe to values that was used during render call.
 *
 * @example
 * ``` ts
 * const state = signalState(5);
 * @signalsReactive
 * const Counter = () => (
 *   <div>
 *     <div>{state.get()}</div> // on first render will subscribe to state changes
 *     <button onPress={() => state.set(state.get() - 1)}>-</button>
 *     <button onPress={() => state.set(state.get() + 1)}>+</button>
 *   </div>
 * );
 * const _Counter = ; // sets up signals context, that would be cleaned up on render finish
 * export { _Counter as Counter };
 * ```
 */
export function signalsReactive<Render extends Functor<[props: never, effect: SignalEffect], ReactNode>>(
  render: Render,
  sync?: boolean,
): Omit<Render, ""> & Functor<[props: InferFunctor<Render>["Params"][0]], InferFunctor<Render>["Result"]> {
  const SignalsComponent = (props: InferFunctor<Render>["Params"][0]) => {
    using _signals = useSignalsReactive(sync);
    return render(props, _signals.effect);
  };
  // @ts-expect-error(2704)
  delete SignalsComponent.name;
  Object.setPrototypeOf(SignalsComponent, render);
  return SignalsComponent as never;
}
