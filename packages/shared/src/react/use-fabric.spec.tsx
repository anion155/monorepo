import { describe, expect, it } from "@jest/globals";

import { renderHook } from "./test-utils/render";
import { useFabric } from "./use-fabric";

describe("useFabric()", () => {
  it("should fabricate and dispose value", () => {
    const hook = renderHook(useFabric<DisposableStack>, () => new DisposableStack(), [1]);
    const first = hook.result.current;
    expect(first).toBeInstanceOf(DisposableStack);
    expect(first.disposed).toBe(false);

    hook.rerender(() => new DisposableStack(), [2]);
    const second = hook.result.current;
    expect(first.disposed).toBe(true);
    expect(second).not.toBe(first);
    expect(second.disposed).toBe(false);

    hook.unmount();
    expect(second.disposed).toBe(true);
  });
});
