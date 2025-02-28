import { describe, expect, it } from "@jest/globals";

import { renderHook } from "./test-utils/render";
import { useConst } from "./use-const";

describe("useConst()", () => {
  it("should fabricate and dispose value", () => {
    const hook = renderHook(useConst<DisposableStack>, () => new DisposableStack());
    expect(hook.result.current).toBeInstanceOf(DisposableStack);
    expect(hook.result.current.disposed).toBe(false);
    hook.unmount();
    expect(hook.result.current.disposed).toBe(true);
  });
});
