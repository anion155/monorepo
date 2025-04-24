import { describe, expect, it } from "@jest/globals";

import { renderHook } from "./test-utils/render";
import { useDeepMemo } from "./use-deep-memo";

describe("useDeepMemo()", () => {
  it("should update reference only when compare returned false", () => {
    const hook = renderHook(useDeepMemo, { a: 0 });
    const first = hook.result.current;
    expect(first).toStrictEqual({ a: 0 });

    hook.rerender({ a: 0 });
    const second = hook.result.current;
    expect(first).toBe(second);

    hook.rerender({ a: 1 });
    const third = hook.result.current;
    expect(first).not.toBe(third);
  });
});
