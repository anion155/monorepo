import { cloneElement, createElement, isValidElement, JSXElementConstructor, ReactElement, ReactNode, RefObject, useEffect } from "react";

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

/**
 * Render wrapper that adds support for GlobalWrappers.
 *
 * @example
 * const globalWrappers = new GlobalWrappers();
 * const render = createRender(domRender, {}, globalWrappers, []);
 * globalWrappers.push(<Provider value={{}} />)
 * render(<TestComponent />); // <Provider value={{}}><TestComponent /></Provider>
 */
export function createRender<
  BaseRender extends (
    ui: ReactNode,
    options: { wrapper: JSXElementConstructor<{ children: ReactNode }> },
  ) => {
    rerender: (ui: ReactNode) => void;
    unmount: () => void;
  },
  BaseOptions extends Partial<Omit<InferFunctor<BaseRender>["Params"][1], "wrapper">>,
>(baseRender: BaseRender, baseOptions: BaseOptions, globalWrappers: GlobalWrappers, wrappers: WrapperArgP[] | undefined) {
  type Options = Omit<InferFunctor<BaseRender>["Params"][1], "wrapper"> & { wrapper?: WrapperArgP | WrapperArgP[] };
  const render = (ui: ReactNode, options?: Options): InferFunctor<BaseRender>["Result"] => {
    const wrapper = globalWrappers.createWrapper(options?.wrapper, wrappers);
    return baseRender(ui, { ...baseOptions, ...options, wrapper });
  };
  return Object.assign(render, {
    render,
    /**
     * Adds {@link next} wrappers to current render function.
     *
     * @example
     * const globalWrappers = new GlobalWrappers()
     * const render = createRender(domRender, {}, globalWrappers, []);
     * globalWrappers.push(<ProviderA />)
     * render.with(<ProviderB />).render(<TestComponent />); // <ProviderA><ProviderB><TestComponent /></ProviderB></ProviderA>
     */
    with: (...next: WrapperArgP[]) => createRender(baseRender, baseOptions, globalWrappers, [...(wrappers ?? []), ...next]),
    /**
     * Creates render function without wrappers.
     *
     * @example
     * const globalWrappers = new GlobalWrappers()
     * const render = createRender(domRender, {}, globalWrappers, []);
     * globalWrappers.push(<ProviderA />)
     * render.without().render(<TestComponent />); // <TestComponent />
     */
    without: () => createRender(baseRender, baseOptions, globalWrappers, []),
  });
}

/**
 * Render hook wrapper that adds support for GlobalWrappers.
 *
 * @example
 * const globalWrappers = ;
 * const render = createRenderHook(domRender, {}, globalWrappers, []);
 * globalWrappers.push(<Provider value={{}} />)
 * render(<TestComponent />); // <Provider value={{}}><TestComponent /></Provider>
 */
export function createRenderHook<
  BaseRender extends (
    ui: ReactNode,
    options: { wrapper: JSXElementConstructor<{ children: ReactNode }> },
  ) => {
    rerender: (ui: ReactNode) => void;
    unmount: () => void;
  },
>(
  baseRender: BaseRender,
  options: Omit<InferFunctor<BaseRender>["Params"][1], "wrapper">,
  globalWrappers: GlobalWrappers,
  wrappers: WrapperArgP[] | undefined,
) {
  const renderHook = <Hook extends Functor<never, unknown>>(useHook: Hook, ...params: InferFunctor<Hook>["Params"]) => {
    const result: RefObject<InferFunctor<Hook>["Result"]> = { current: undefined };

    function TestComponent({ params: current }: { params: InferFunctor<Hook>["Params"] }) {
      const pendingResult = useHook(...current);
      useEffect(() => {
        result.current = pendingResult;
      });
      return null;
    }
    const wrapper = globalWrappers.createWrapper(undefined, wrappers);
    const { rerender: baseRerender, unmount } = baseRender(createElement(TestComponent, { params }), { ...options, wrapper });
    function rerender(...next: InferFunctor<Hook>["Params"]) {
      return baseRerender(createElement(TestComponent, { params: next }));
    }

    return { result, rerender, unmount };
  };
  return Object.assign(renderHook, {
    renderHook,
    /**
     * Adds {@link next} wrappers to current renderHook function.
     *
     * @example
     * const globalWrappers = new GlobalWrappers()
     * const renderHook = createRenderHook(domRender, {}, globalWrappers, []);
     * globalWrappers.push(<ProviderA />)
     * renderHook.with(<ProviderB />).renderHook(useHook, 1); // <ProviderA><ProviderB>{useHook(1)}</ProviderB></ProviderA>
     */
    with: (...next: WrapperArgP[]) => createRenderHook(baseRender, options, globalWrappers, [...(wrappers ?? []), ...next]),
    /**
     * Creates render function without wrappers.
     *
     * @example
     * const globalWrappers = new GlobalWrappers()
     * const renderHook = createRenderHook(domRender, {}, globalWrappers, []);
     * globalWrappers.push(<ProviderA />)
     * renderHook.without().renderHook(useHook, 1); // useHook(1)
     */
    without: () => createRenderHook(baseRender, options, globalWrappers, []),
  });
}
