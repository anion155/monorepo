import { act } from "@testing-library/react";
import type { JSXElementConstructor, ReactElement, ReactNode } from "react";
import { cloneElement, createElement, isValidElement, useEffect } from "react";

import { doThrow } from "../../../do";
import { DeveloperError } from "../../../errors";

export type Wrapper = JSXElementConstructor<{ children?: ReactNode }>;
export type WrapperArg = Wrapper | ReactElement<{ children?: ReactNode }>;
export type WrapperArgP = WrapperArg | typeof globalWrappersPlaceholder;

/** Global wrappers placeholder. */
export const globalWrappersPlaceholder = Symbol.for("reactRender#globalWrappers");
/**
 * Global wrappers api. Provides developer way to setup wrappers in context
 *
 * @example
 * const globalWrappers = new GlobalWrappers();
 * globalWrappers.push(<Provider value={{}} />)
 * globalWrappers.combine(); // ({children}) => <Provider value={{}}>{children}</Provider>
 */
export class GlobalWrappers {
  readonly items: WrapperArg[] = [];

  push(...wrappers: WrapperArg[]) {
    return this.items.push(...wrappers);
  }
  pop() {
    this.items.pop();
  }
  clear() {
    this.items.splice(0, this.items.length);
  }

  createWrapper(option: WrapperArgP | WrapperArgP[] | undefined, context: WrapperArgP[] | undefined) {
    const createWrapperRenderer =
      (current: WrapperArgP[], renderGlobalPlaceholder: (element: ReactNode) => ReactNode) =>
      (children: ReactNode): ReactNode => {
        let element = children;
        for (let index = current.length - 1; index >= 0; index -= 1) {
          const wrapper = current[index];
          if (isValidElement(wrapper)) {
            element = cloneElement(wrapper, {}, element);
          } else if (wrapper === globalWrappersPlaceholder) {
            element = renderGlobalPlaceholder(element);
          } else {
            element = createElement(wrapper, {}, element);
          }
        }
        return element;
      };

    let wrappers: WrapperArgP[];
    if (option) {
      wrappers = Array.isArray(option) ? option : [option];
    } else if (!context) {
      wrappers = [globalWrappersPlaceholder];
    } else {
      wrappers = context;
    }
    const Wrapper: Wrapper = ({ children }) => {
      let element = children;
      let globalUsed = false;
      const renderGlobalWrapper = createWrapperRenderer(this.items, () => doThrow(new DeveloperError("circular globalWrappers")));
      element = createWrapperRenderer(wrappers, (current) => {
        if (globalUsed) throw new DeveloperError("globalWrappers.placeholder was used twice in wrappers array");
        globalUsed = true;
        return renderGlobalWrapper(current);
      })(element);
      return element;
    };
    return Wrapper;
  }
}

export type AnyRender = (
  ui: ReactNode,
  options: { wrapper: JSXElementConstructor<{ children: ReactNode }> },
) => {
  rerender: (ui: ReactNode) => void;
  unmount: () => void;
};

export type WrappedRenderParams<BaseRender extends AnyRender> = [
  ui: ReactNode,
  options?: Omit<Parameters<BaseRender>[1], "wrapper"> & { wrapper?: WrapperArgP | WrapperArgP[] },
];
export type WrappedRenderFunction<BaseRender extends AnyRender> = {
  (...params: WrappedRenderParams<BaseRender>): ReturnType<BaseRender>;
};
export type WrappedRenderActedFunction<BaseRender extends AnyRender> = {
  (...params: WrappedRenderParams<BaseRender>): Promise<ReturnType<BaseRender>>;
};
export type WrappedRender<BaseRender extends AnyRender> = WrappedRenderFunction<BaseRender> & {
  render: WrappedRenderFunction<BaseRender>;
  acted: WrappedRenderActedFunction<BaseRender>;
  baseRender: BaseRender;
  /**
   * Adds {@link next} wrappers to current render function.
   *
   * @example
   * const globalWrappers = new GlobalWrappers()
   * const render = createRender(domRender, {}, globalWrappers, []);
   * globalWrappers.push(<ProviderA />)
   * render.with(<ProviderB />).render(<TestComponent />); // <ProviderA><ProviderB><TestComponent /></ProviderB></ProviderA>
   */
  with: (...next: WrapperArgP[]) => WrappedRender<BaseRender>;
  /**
   * Creates render function without wrappers.
   *
   * @example
   * const globalWrappers = new GlobalWrappers()
   * const render = createRender(domRender, {}, globalWrappers, []);
   * globalWrappers.push(<ProviderA />)
   * render.without().render(<TestComponent />); // <TestComponent />
   */
  without: () => WrappedRender<BaseRender>;
};

/**
 * Render wrapper that adds support for GlobalWrappers.
 *
 * @example
 * const globalWrappers = new GlobalWrappers();
 * const render = createRender(domRender, {}, globalWrappers, []);
 * globalWrappers.push(<Provider value={{}} />)
 * render(<TestComponent />); // <Provider value={{}}><TestComponent /></Provider>
 */
export function createRender<BaseRender extends AnyRender>(
  baseRender: BaseRender,
  baseOptions: Parameters<BaseRender>[1],
  globalWrappers: GlobalWrappers,
  wrappers: WrapperArgP[] | undefined,
): WrappedRender<BaseRender> {
  const render: WrappedRenderFunction<BaseRender> = (ui, options) => {
    const wrapper = globalWrappers.createWrapper(options?.wrapper, wrappers);
    return baseRender(ui, { ...baseOptions, ...options, wrapper }) as ReturnType<BaseRender>;
  };
  const methods: Omit<WrappedRender<BaseRender>, ""> = {
    render,
    acted: (...params) => act(() => render(...params)),
    baseRender,
    with: (...next) => createRender(baseRender, baseOptions, globalWrappers, [...(wrappers ?? []), ...next]),
    without: () => createRender(baseRender, baseOptions, globalWrappers, []),
  };
  return Object.assign(render, methods);
}

export type RenderHookResult<Hook extends Functor<never, unknown>> = {
  result: { current: InferFunctor<Hook>["Result"]; times: number };
  rerender: (...next: InferFunctor<Hook>["Params"]) => void;
  unmount: () => void;
};
export type RenderHookFunction = {
  <Hook extends Functor<never, unknown>>(useHook: Hook, ...params: InferFunctor<Hook>["Params"]): RenderHookResult<Hook>;
};
export type WrappedRenderHook<BaseRender extends AnyRender> = RenderHookFunction & {
  renderHook: RenderHookFunction;
  baseRender: BaseRender;
  /**
   * Adds {@link next} wrappers to current renderHook function.
   *
   * @example
   * const globalWrappers = new GlobalWrappers()
   * const renderHook = createRenderHook(domRender, {}, globalWrappers, []);
   * globalWrappers.push(<ProviderA />)
   * renderHook.with(<ProviderB />).renderHook(useHook, 1); // <ProviderA><ProviderB>{useHook(1)}</ProviderB></ProviderA>
   */
  with: (...next: WrapperArgP[]) => WrappedRenderHook<BaseRender>;
  /**
   * Creates render function without wrappers.
   *
   * @example
   * const globalWrappers = new GlobalWrappers()
   * const renderHook = createRenderHook(domRender, {}, globalWrappers, []);
   * globalWrappers.push(<ProviderA />)
   * renderHook.without().renderHook(useHook, 1); // useHook(1)
   */
  without: () => WrappedRenderHook<BaseRender>;
};

/**
 * Render hook wrapper that adds support for GlobalWrappers.
 *
 * @example
 * const globalWrappers = ;
 * const render = createRenderHook(domRender, {}, globalWrappers, []);
 * globalWrappers.push(<Provider value={{}} />)
 * render(<TestComponent />); // <Provider value={{}}><TestComponent /></Provider>
 */
export function createRenderHook<BaseRender extends AnyRender>(
  baseRender: BaseRender,
  options: Omit<InferFunctor<BaseRender>["Params"][1], "wrapper">,
  globalWrappers: GlobalWrappers,
  wrappers: WrapperArgP[] | undefined,
): WrappedRenderHook<BaseRender> {
  const renderHook: RenderHookFunction = (useHook, ...initialParams) => {
    const result = { current: undefined as unknown, times: 0 };
    function TestComponent({ params }: { params: never }) {
      const pendingResult = useHook(...params);
      useEffect(() => {
        result.current = pendingResult;
        if (!Number.isSafeInteger(result.times)) result.times = 0;
        result.times += 1;
      });
      return null;
    }
    const wrapper = globalWrappers.createWrapper(undefined, wrappers);
    const { rerender: baseRerender, unmount } = baseRender(createElement(TestComponent, { params: initialParams }), { ...options, wrapper });
    function rerender(...nextParams: never) {
      return baseRerender(createElement(TestComponent, { params: nextParams }));
    }
    return { result, rerender, unmount };
  };
  const methods: Omit<WrappedRenderHook<BaseRender>, ""> = {
    renderHook,
    baseRender,
    with: (...next) => createRenderHook(baseRender, options, globalWrappers, [...(wrappers ?? []), ...next]),
    without: () => createRenderHook(baseRender, options, globalWrappers, []),
  };
  return Object.assign(renderHook, methods);
}
