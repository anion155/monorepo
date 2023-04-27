import { expect, test } from "@jest/globals";
import { act, renderHook } from "@testing-library/react";
import { useState } from "react";

import { useLensedState } from "../use-lensed-state";

test("useLensedState", () => {
  const hook = renderHook(() => {
    const parent = useState({ a: 1 });
    const child = useLensedState(
      parent,
      (v) => v.a,
      (a, v) => ({ ...v, a })
    );
    return { child, parent };
  });

  expect(hook.result.current).toStrictEqual({
    parent: [{ a: 1 }, expect.any(Function)],
    child: [1, expect.any(Function)],
  });

  act(() => hook.result.current.child[1](5));
  expect(hook.result.current).toStrictEqual({
    parent: [{ a: 5 }, expect.any(Function)],
    child: [5, expect.any(Function)],
  });

  act(() => hook.result.current.parent[1]({ a: 2 }));
  expect(hook.result.current).toStrictEqual({
    parent: [{ a: 2 }, expect.any(Function)],
    child: [2, expect.any(Function)],
  });
});
