import { describe, expect, it, jest } from "@jest/globals";

import { SignalEffect } from "./effect";
import { SignalState } from "./state";

describe("class SignalEffect", () => {
  it("should every time value of dependencies changed", () => {
    const stateA = new SignalState(1);
    const stateB = new SignalState({ c: 1, d: 1, e: 1 });

    const effectSpy = jest.fn();
    const cleanupSpy = jest.fn();
    const effect = new SignalEffect(() => {
      const { c, d } = stateB.proxy();
      effectSpy(stateA.value + c + d);
      return cleanupSpy;
    });

    expect(effectSpy.mock.calls).toStrictEqual([[3]]);
    expect(cleanupSpy).toHaveBeenCalledTimes(0);

    stateA.value = 2;
    expect(effectSpy.mock.calls).toStrictEqual([[3], [4]]);
    expect(cleanupSpy).toHaveBeenCalledTimes(1);

    stateB.value = { c: 1, d: 1, e: 2 };
    expect(effectSpy.mock.calls).toStrictEqual([[3], [4], [4]]);
    expect(cleanupSpy).toHaveBeenCalledTimes(2);

    stateB.field("e").set(3);
    expect(effectSpy.mock.calls).toStrictEqual([[3], [4], [4]]);
    expect(cleanupSpy).toHaveBeenCalledTimes(2);

    effect.dispose();
    expect(cleanupSpy).toHaveBeenCalledTimes(3);
  });
});
