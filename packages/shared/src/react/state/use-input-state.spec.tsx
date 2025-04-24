import { describe, expect, it, jest } from "@jest/globals";

import { act, renderHook } from "../test-utils";
import { useInputState } from "./use-input-state";

describe("useInputState()", () => {
  const value1 = Symbol("test-value-1");
  const value2 = Symbol("test-value-2");
  const onChange = jest.fn();

  describe("with value", () => {
    it("render", () => {
      const hook = renderHook(useInputState<symbol>, { value: value1, onChange });

      expect(hook.result.current).toStrictEqual([value1, expect.any(Function)]);
      expect(onChange).not.toHaveBeenCalled();
    });

    it("re-render with next value", () => {
      const hook = renderHook(useInputState<symbol>, { value: value1, onChange });
      hook.rerender({ value: value2, onChange });

      expect(hook.result.current[0]).toStrictEqual(value2);
    });

    it("call setter with next value", () => {
      const hook = renderHook(useInputState<symbol>, { value: value1, onChange });
      act(() => hook.result.current[1](value2));

      expect(onChange).toHaveBeenCalledWith(value2);
      expect(hook.result.current[0]).toStrictEqual(value1);
    });
  });

  describe("with defaultValue", () => {
    it("render", () => {
      const hook = renderHook(useInputState<symbol>, { defaultValue: value1, onChange });

      expect(hook.result.current).toStrictEqual([value1, expect.any(Function)]);
      expect(onChange).not.toHaveBeenCalled();
    });

    it("re-render with next value", () => {
      const hook = renderHook(useInputState<symbol>, { defaultValue: value1, onChange });
      hook.rerender({ defaultValue: value2, onChange });

      expect(hook.result.current[0]).toStrictEqual(value1);
    });

    it("call setter with next value", () => {
      const hook = renderHook(useInputState<symbol>, { defaultValue: value1, onChange });
      act(() => hook.result.current[1](value2));

      expect(onChange).toHaveBeenCalledWith(value2);
      expect(hook.result.current[0]).toStrictEqual(value2);
    });
  });
});
