import { act, render, screen } from "@anion155/shared/react";
import { describe, expect, it } from "@jest/globals";

import { SignalState } from "../state";
import { useSignalsReactive } from "./use-signals-reactive";

describe("useSignalsReactive()", () => {
  const setup = (sync?: boolean) => {
    const signal = new SignalState(5);
    function Component() {
      using _signals = useSignalsReactive(sync);
      return <div data-testid="test">value: {signal.get()}</div>;
    }
    return { signal, Component };
  };

  it("should subscribe component to signals", () => {
    const { signal, Component } = setup();
    render(<Component />);
    expect(screen.getByTestId("test")).toHaveTextContent("value: 5");
    act(() => signal.set(6));
    expect(screen.getByTestId("test")).toHaveTextContent("value: 6");
  });

  it("should subscribe component to signals asynchronously", async () => {
    const { signal, Component } = setup(false);
    render(<Component />);
    expect(screen.getByTestId("test")).toHaveTextContent("value: 5");
    act(() => signal.set(6));
    expect(screen.getByTestId("test")).toHaveTextContent("value: 5");
    await act(() => Promise.resolve());
    expect(screen.getByTestId("test")).toHaveTextContent("value: 6");
  });
});
