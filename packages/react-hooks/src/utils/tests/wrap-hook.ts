// FIXME: later
// eslint-disable-next-line import/no-extraneous-dependencies -- :-(
import { renderHook } from "@testing-library/react";
import type { RenderHookResult } from "@testing-library/react";

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
  useHook: F
): WrappedHookRenderer<F> {
  const wrappedRender = (...initialArgs: Parameters<F>) => {
    const hook = renderHook(({ args }) => useHook(...args), {
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
