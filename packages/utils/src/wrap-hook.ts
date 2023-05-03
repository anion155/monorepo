import type { renderHook, RenderHookResult } from "@testing-library/react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- only `any` suitable in this case
type WrappedRenderHookResult<As extends any[], R> = RenderHookResult<
  R,
  { args: As }
> & {
  rerender: (...args: As) => void;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- only `any` suitable in this case
type WrappedHookRenderer<F extends (...args: any[]) => any> = F extends (
  ...args: infer As
) => infer R
  ? (...args: As) => WrappedRenderHookResult<As, R>
  : never;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- only `any` suitable in this case
export function wrapHook<F extends (...args: any[]) => any>(
  useHook: F,
  renderer: typeof renderHook
): WrappedHookRenderer<F> {
  const wrappedRender = (...initialArgs: Parameters<F>) => {
    const hook = renderer(({ args }) => useHook(...args), {
      initialProps: { args: initialArgs },
    });
    const origRerender = hook.rerender;
    return Object.assign(hook, {
      rerender(...args: Parameters<F>) {
        return origRerender.call(hook, { args });
      },
    });
  };
  return wrappedRender as never;
}
