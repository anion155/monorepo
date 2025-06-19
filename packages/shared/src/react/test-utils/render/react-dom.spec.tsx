import { describe, expect, it } from "@jest/globals";
import { render as baseRender } from "@testing-library/react";
import type { ContextType, FC } from "react";
import { createContext, useContext } from "react";

import type { Wrapper } from "./base";
import { globalWrappers, render, renderHook } from "./react-dom";

describe("react-dom render utils", () => {
  const ProviderA = "mock-provider-A" as never as Wrapper;
  const ProviderB = "mock-provider-B" as never as Wrapper;
  const Context = createContext({ type: "context-default" });
  const TestComponent = "mock-test" as never as FC<object>;
  globalWrappers.push(ProviderA, <Context.Provider value={{ type: "context-provided" }} />);

  it("render() should render component", () => {
    expect(render.with(ProviderB).render(<TestComponent />).container).toStrictEqual(
      baseRender(
        <ProviderB>
          <TestComponent />
        </ProviderB>,
      ).container,
    );
  });

  it("renderHook() should render hook", () => {
    const args = [useContext<ContextType<typeof Context>>, Context] as const;
    expect(renderHook.with(<Context.Provider value={{ type: "context-with" }} />).renderHook(...args).result.current).toStrictEqual({
      type: "context-with",
    });
    expect(renderHook(...args).result.current).toStrictEqual({ type: "context-provided" });
    expect(renderHook.without().renderHook(...args).result.current).toStrictEqual({ type: "context-default" });
  });
});
