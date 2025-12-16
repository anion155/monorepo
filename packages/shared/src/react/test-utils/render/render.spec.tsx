import { describe, expect, it, jest } from "@jest/globals";
import { act, render as baseRender } from "@testing-library/react";
import type { ContextType, FC } from "react";
import { createContext, Suspense, use, useContext, useMemo } from "react";

import { DeveloperError } from "../../../errors";
import type { Wrapper } from "./base";
import { createRender, createRenderHook, GlobalWrappers, globalWrappersPlaceholder } from "./base";

describe("render test utils", () => {
  const ProviderA = "mock-provider-A" as never as Wrapper;
  const ProviderB = "mock-provider-B" as never as Wrapper;
  const ProviderC = "mock-provider-C" as never as Wrapper;
  const ProviderD = "mock-provider-D" as never as Wrapper;
  const Context = createContext({ type: "context-default" });
  const TestComponent = "mock-test" as never as FC<object>;

  describe("GlobalWrappers", () => {
    it("should fill items", () => {
      const globalWrappers = new GlobalWrappers();
      globalWrappers.push(<ProviderA />);
      globalWrappers.push(<ProviderB />);
      // eslint-disable-next-line react/jsx-key
      expect(globalWrappers.items).toStrictEqual([<ProviderA />, <ProviderB />]);
      globalWrappers.pop();
      // eslint-disable-next-line react/jsx-key
      expect(globalWrappers.items).toStrictEqual([<ProviderA />]);
      globalWrappers.clear();
      expect(globalWrappers.items).toStrictEqual([]);
    });

    it("should create wrapper from options wrapper", () => {
      const globalWrappers = new GlobalWrappers();
      globalWrappers.push(<ProviderA />);
      // eslint-disable-next-line react/jsx-key
      const wrapper = globalWrappers.createWrapper(<ProviderB />, [<ProviderC />]);
      expect(baseRender(<TestComponent />, { wrapper }).container).toStrictEqual(
        baseRender(
          <ProviderB>
            <TestComponent />
          </ProviderB>,
        ).container,
      );
    });

    it("should create wrapper from options wrapper array", () => {
      const globalWrappers = new GlobalWrappers();
      globalWrappers.push(<ProviderA />);
      // eslint-disable-next-line react/jsx-key
      const wrapper = globalWrappers.createWrapper([<ProviderB />, ProviderC], [<ProviderD />]);
      expect(baseRender(<TestComponent />, { wrapper }).container).toStrictEqual(
        baseRender(
          <ProviderB>
            <ProviderC>
              <TestComponent />
            </ProviderC>
          </ProviderB>,
        ).container,
      );
    });

    it("should create wrapper from global wrappers only", () => {
      const globalWrappers = new GlobalWrappers();
      globalWrappers.push(<ProviderA />);
      const wrapper = globalWrappers.createWrapper(undefined, undefined);
      expect(baseRender(<TestComponent />, { wrapper }).container).toStrictEqual(
        baseRender(
          <ProviderA>
            <TestComponent />
          </ProviderA>,
        ).container,
      );
    });

    it("should create wrapper from context with global wrappers inline", () => {
      const globalWrappers = new GlobalWrappers();
      globalWrappers.push(<ProviderA />);
      // eslint-disable-next-line react/jsx-key
      const wrapper = globalWrappers.createWrapper(undefined, [<ProviderB />, globalWrappersPlaceholder, <ProviderC />]);
      expect(baseRender(<TestComponent />, { wrapper }).container).toStrictEqual(
        baseRender(
          <ProviderB>
            <ProviderA>
              <ProviderC>
                <TestComponent />
              </ProviderC>
            </ProviderA>
          </ProviderB>,
        ).container,
      );
    });

    it("should create wrapper from context and global wrappers", () => {
      const globalWrappers = new GlobalWrappers();
      globalWrappers.push(<ProviderA />);
      // eslint-disable-next-line react/jsx-key
      const wrapper = globalWrappers.createWrapper(undefined, [<ProviderB />, <ProviderC />]);
      expect(baseRender(<TestComponent />, { wrapper }).container).toStrictEqual(
        baseRender(
          <ProviderB>
            <ProviderC>
              <TestComponent />
            </ProviderC>
          </ProviderB>,
        ).container,
      );
    });

    it("should throw error about circular global providers", () => {
      const globalWrappers = new GlobalWrappers();
      globalWrappers.push(<ProviderA />, globalWrappersPlaceholder as never);
      const wrapper = globalWrappers.createWrapper(undefined, undefined);
      expect(() => baseRender(<TestComponent />, { wrapper })).toThrow(new DeveloperError("circular globalWrappers"));
    });

    it("should throw error about global providers used twice", () => {
      const globalWrappers = new GlobalWrappers();
      globalWrappers.push(<ProviderA />);
      // eslint-disable-next-line react/jsx-key
      const wrapper = globalWrappers.createWrapper([globalWrappersPlaceholder, <ProviderC />, globalWrappersPlaceholder], undefined);
      expect(() => baseRender(<TestComponent />, { wrapper })).toThrow(
        new DeveloperError("globalWrappers.placeholder was used twice in wrappers array"),
      );
    });
  });

  describe("createRender()", () => {
    const globalWrappers = new GlobalWrappers();
    globalWrappers.push(<ProviderA />);

    it("should create render function", () => {
      const render = createRender(baseRender, {}, globalWrappers, undefined);
      expect(render(<TestComponent />).container).toStrictEqual(
        baseRender(
          <ProviderA>
            <TestComponent />
          </ProviderA>,
        ).container,
      );
    });

    it("should render with provider", () => {
      const render = createRender(baseRender, {}, globalWrappers, undefined);
      expect(render.with(ProviderB).render(<TestComponent />).container).toStrictEqual(
        baseRender(
          <ProviderB>
            <TestComponent />
          </ProviderB>,
        ).container,
      );
    });

    it("should render without any providers", () => {
      const render = createRender(baseRender, {}, globalWrappers, undefined);
      expect(render.without().render(<TestComponent />).container).toStrictEqual(baseRender(<TestComponent />).container);
    });

    it.failing("will fail without .acted() wrapper", async () => {
      const render = createRender(baseRender, {}, new GlobalWrappers(), undefined);
      const deferred = Promise.withResolvers<string>();
      const AsyncComponent = () => {
        return use(deferred.promise);
      };
      using errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const component = render(<Suspense fallback="loading" children={<AsyncComponent />} />);
      expect(component.asFragment()).toHaveTextContent("loading");
      await act(() => {
        deferred.resolve("resolved");
        return Promise.resolve();
      });
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("A component suspended inside an `act` scope"));
      expect(component.asFragment()).toHaveTextContent("resolved");
    });

    it("this.acted() should properly render async component", async () => {
      const render = createRender(baseRender, {}, new GlobalWrappers(), undefined);
      const deferred = Promise.withResolvers<string>();
      const AsyncComponent = () => {
        return use(deferred.promise);
      };
      using errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const component = await render.acted(<Suspense fallback="loading" children={<AsyncComponent />} />);
      expect(component.asFragment()).toHaveTextContent("loading");
      await act(() => {
        deferred.resolve("resolved");
        return Promise.resolve();
      });
      expect(component.asFragment()).toHaveTextContent("resolved");
      expect(errorSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe("createRenderHook()", () => {
    const globalWrappers = new GlobalWrappers();
    globalWrappers.push(<Context.Provider value={{ type: "context-provided" }} />);
    const useHook = jest.fn(useMemo);

    it("should create renderHook function", () => {
      const renderHook = createRenderHook(baseRender, {}, globalWrappers, undefined);
      const value = { type: "test-value" };
      const factory = jest.fn().mockReturnValue(value);
      const hook = renderHook(useHook, factory, [1]);

      expect(hook.result.current).toStrictEqual(value);
      expect(factory).toHaveBeenCalledWith();
    });

    it("should rerender hook", () => {
      const renderHook = createRenderHook(baseRender, {}, globalWrappers, undefined);

      const value1 = { type: "test-value-1" };
      const factory1 = jest.fn().mockReturnValue(value1);

      const value2 = { type: "test-value-2" };
      const factory2 = jest.fn().mockReturnValue(value2);

      const hook = renderHook(useHook, factory1, [1]);

      hook.rerender(factory2, [2]);
      expect(hook.result.current).toStrictEqual(value2);
      expect(factory2).toHaveBeenCalledWith();
    });

    it("should render global wrappers", () => {
      const renderHook = createRenderHook(baseRender, {}, globalWrappers, undefined);
      const hook = renderHook(useContext<ContextType<typeof Context>>, Context);
      expect(hook.result.current).toStrictEqual({ type: "context-provided" });
    });

    it("should render with provider", () => {
      const renderHook = createRenderHook(baseRender, {}, globalWrappers, undefined);
      const hook = renderHook
        .with(<Context.Provider value={{ type: "context-with" }} />)
        .renderHook(useContext<ContextType<typeof Context>>, Context);
      expect(hook.result.current).toStrictEqual({ type: "context-with" });
    });

    it("should render without any providers", () => {
      const renderHook = createRenderHook(baseRender, {}, globalWrappers, undefined);
      const hook = renderHook.without().renderHook(useContext<ContextType<typeof Context>>, Context);
      expect(hook.result.current).toStrictEqual({ type: "context-default" });
    });
  });
});
