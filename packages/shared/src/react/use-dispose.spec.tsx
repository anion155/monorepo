import { describe, expect, it } from "@jest/globals";

import { renderHook } from "./test-utils/render";
import { useDispose } from "./use-dispose";

describe("useDispose()", () => {
  it("should dispose passed disposable value", () => {
    const stack = new DisposableStack();
    const hook = renderHook(useDispose, stack);
    expect(hook.result.current).toBeUndefined();
    expect(stack.disposed).toBe(false);
    hook.unmount();
    expect(stack.disposed).toBe(true);
  });

  it("should dispose passed async disposable value", () => {
    const stack = new AsyncDisposableStack();
    const hook = renderHook(useDispose, stack);
    expect(hook.result.current).toBeUndefined();
    expect(stack.disposed).toBe(false);
    hook.unmount();
    expect(stack.disposed).toBe(true);
  });

  it("should dispose previous disposable value", () => {
    const stack1 = new DisposableStack();
    const stack2 = new AsyncDisposableStack();
    const hook = renderHook(useDispose, stack1);
    hook.rerender(stack2);
    expect(stack1.disposed).toBe(true);
  });

  it("should handle non disposable value", () => {
    const hook = renderHook(useDispose, {});
    hook.unmount();
    expect.assertions(0);
  });
});
