import { act, render, screen } from "@anion155/shared/react";
import { describe, expect, it } from "@jest/globals";

import { SignalState } from "../state";
import { useSignalsReactive } from "./use-signals-reactive";

describe("useSignalsReactive()", () => {
  it("should subscribe component to signals", () => {
    const signal = new SignalState(5);
    function Component() {
      using _signals = useSignalsReactive();
      return <div data-testid="test">value: {signal.get()}</div>;
    }
    render(<Component />);
    expect(screen.getByTestId("test")).toHaveTextContent("value: 5");
    act(() => signal.set(6));
    expect(screen.getByTestId("test")).toHaveTextContent("value: 6");
  });
});
