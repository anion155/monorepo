import { describe, expect, it } from "@jest/globals";
import { createContext } from "react";

import { DeveloperError } from "../errors";
import { globalWrappers, renderHook } from "./test-utils/render";
import { createUseContext } from "./use-context";

describe("createUseContext()", () => {
  const Context = createContext<{ type: string } | undefined>(undefined);
  globalWrappers.push(<Context.Provider value={{ type: "context-provided" }} />);

  it("should create use context for specific context", () => {
    const useContext = createUseContext(Context, "TestContext");
    expect(renderHook(useContext, undefined).result.current).toStrictEqual({ type: "context-provided" });
  });

  it("should throw not wrapped error", () => {
    const useContext = createUseContext(Context, "TestContext");
    expect(() => renderHook.without().renderHook(useContext, undefined)).toThrow(new DeveloperError("should be wrapped in <TestContext.Provider />"));
  });

  it("should use default context name", () => {
    const useContext = createUseContext(Context);
    expect(() => renderHook.without().renderHook(useContext, undefined)).toThrow(new DeveloperError("should be wrapped in <.Provider />"));
  });

  it("should use context display name", () => {
    const SpecificContext = createContext<{ type: string } | undefined>(undefined);
    SpecificContext.displayName = "TestContextDisplay";
    const useContext = createUseContext(SpecificContext);
    expect(() => renderHook.without().renderHook(useContext, undefined)).toThrow(
      new DeveloperError("should be wrapped in <TestContextDisplay.Provider />"),
    );
  });

  it("should not throw error if optional", () => {
    const useContext = createUseContext(Context);
    const hook = renderHook.without().renderHook(useContext, true);
    expect(hook.result.current).toBeUndefined();
  });
});
