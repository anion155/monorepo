import { act, render, screen } from "@anion155/shared/react";
import { describe, expect, it, jest } from "@jest/globals";

import { DeveloperError, SignalEffect, SignalReadonlyComputed, SignalState } from "../index";
import { context } from "../internals";
import { signalsReactive } from "./signals-reactive";

describe("signalsReactive()", () => {
  it("should create component from render function", () => {
    const state = new SignalState(5);
    const logger = jest.fn<Functor<unknown[], unknown>>();
    const renderComponent = ({ value }: { value: number }) => {
      logger(signalsReactive.getEffect());
      return (
        <>
          <div data-testid="value">value: {value}</div>
          <div data-testid="signal">value: {state.get()}</div>
        </>
      );
    };
    const Component = signalsReactive(renderComponent);
    render(<Component value={2} />);
    expect(screen.getByTestId("value")).toHaveTextContent("value: 2");
    expect(screen.getByTestId("signal")).toHaveTextContent("value: 5");
    expect(logger).toHaveBeenCalledWith(expect.any(SignalEffect));
    act(() => state.set(6));
    expect(screen.getByTestId("signal")).toHaveTextContent("value: 6");
  });

  it("signalsReactive.getEffect() should handle invalid state calls", () => {
    expect(() => signalsReactive.getEffect()).toStrictThrow(new DeveloperError("getEffect() must be called in subscription context"));
  });

  it("signalsReactive.getEffect() should be called while rendering", () => {
    const listener = new SignalEffect(() => {});
    using _subscription = context.setupSubscriptionContext(listener);
    expect(signalsReactive.getEffect()).toBeUndefined();
  });

  it("signalsReactive.getEffect() should be called for SignalEffect listener", () => {
    const listener = new SignalReadonlyComputed(() => 5);
    using subscription = context.setupSubscriptionContext(listener);
    Object.assign(Object.getPrototypeOf(subscription), { render: true });
    expect(signalsReactive.getEffect()).toBeUndefined();
  });
});
