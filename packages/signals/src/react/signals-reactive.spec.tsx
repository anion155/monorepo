import { act, render, screen } from "@anion155/shared/react";
import { describe, expect, it, jest } from "@jest/globals";

import { SignalEffect } from "../effect";
import { SignalState } from "../state";
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
});
