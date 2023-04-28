import { jest, expect, test, describe } from "@jest/globals";
import { wrapHook } from "@monorepo/configs/src/wrap-hook";
import { act } from "@testing-library/react";

import { useInputState } from "../use-input-state";

const renderInputStateHook = wrapHook(useInputState<symbol>);

describe("useInputState", () => {
  const value1 = Symbol("test-value-1");
  const value2 = Symbol("test-value-2");
  const onValueChange = jest.fn();

  describe("with value", () => {
    test("render", () => {
      const hook = renderInputStateHook({ value: value1, onValueChange });

      expect(hook.result.current).toStrictEqual([value1, expect.any(Function)]);
      expect(onValueChange).not.toHaveBeenCalled();
    });

    test("re-render with next value", () => {
      const hook = renderInputStateHook({ value: value1, onValueChange });
      hook.rerender({ value: value2, onValueChange });

      expect(hook.result.current[0]).toStrictEqual(value2);
    });

    test("call setter with next value", () => {
      const hook = renderInputStateHook({ value: value1, onValueChange });
      act(() => hook.result.current[1](value2));

      expect(onValueChange).toHaveBeenCalledWith(value2);
      expect(hook.result.current[0]).toStrictEqual(value1);
    });
  });

  describe("with defaultValue", () => {
    test("render", () => {
      const hook = renderInputStateHook({
        defaultValue: value1,
        onValueChange,
      });

      expect(hook.result.current).toStrictEqual([value1, expect.any(Function)]);
      expect(onValueChange).not.toHaveBeenCalled();
    });

    test("re-render with next value", () => {
      const hook = renderInputStateHook({
        defaultValue: value1,
        onValueChange,
      });
      hook.rerender({ defaultValue: value2, onValueChange });

      expect(hook.result.current[0]).toStrictEqual(value1);
    });

    test("call setter with next value", () => {
      const hook = renderInputStateHook({
        defaultValue: value1,
        onValueChange,
      });
      act(() => hook.result.current[1](value2));

      expect(onValueChange).toHaveBeenCalledWith(value2);
      expect(hook.result.current[0]).toStrictEqual(value2);
    });
  });
});
