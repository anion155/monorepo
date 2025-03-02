import { act, render, screen } from "@anion155/shared/react";
import { describe, expect, it, jest } from "@jest/globals";

import { SignalEffect } from "../effect";
import { SignalState } from "../state";
import { signalsReactive } from "./signals-reactive";

describe("signalsReactive()", () => {
  it("should create component from render function", () => {
    const signal = new SignalState(5);
    const logger = jest.fn<Functor<unknown[], unknown>>();
    const renderComponent = ({ value }: { value: number }, effect: SignalEffect) => {
      logger(effect);
      return (
        <>
          <div data-testid="value">value: {value}</div>
          <div data-testid="signal">value: {signal.get()}</div>
        </>
      );
    };
    const Component = signalsReactive(renderComponent);
    render(<Component value={2} />);
    expect(screen.getByTestId("value")).toHaveTextContent("value: 2");
    expect(screen.getByTestId("signal")).toHaveTextContent("value: 5");
    expect(logger).toHaveBeenCalledWith(expect.any(SignalEffect));
    act(() => signal.set(6));
    expect(screen.getByTestId("signal")).toHaveTextContent("value: 6");
  });
});
