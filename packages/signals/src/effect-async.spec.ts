import { describe, expect, it, jest } from "@jest/globals";

import { SignalEffectAsync } from "./effect-async";
import { SignalState } from "./state";

describe("class SignalEffectAsync", () => {
  it("should batch changes until next promise tick", async () => {
    const stateA = new SignalState(1);
    const stateB = new SignalState(1);

    const effectSpy = jest.fn();
    const cleanupSpy = jest.fn();
    const effect = new SignalEffectAsync(() => {
      effectSpy(stateA.value + stateB.value);
      return cleanupSpy;
    });

    stateA.value = 2;
    expect(effectSpy.mock.calls).toStrictEqual([[2]]);
    expect(cleanupSpy).toHaveBeenCalledTimes(0);

    stateB.value = 2;
    expect(effectSpy.mock.calls).toStrictEqual([[2]]);
    expect(cleanupSpy).toHaveBeenCalledTimes(0);

    await Promise.resolve();
    expect(effectSpy.mock.calls).toStrictEqual([[2], [4]]);
    expect(cleanupSpy).toHaveBeenCalledTimes(1);

    effect.dispose();
    expect(cleanupSpy).toHaveBeenCalledTimes(2);
  });

  it(".invalidate(true) should flush bached changes", () => {
    const stateA = new SignalState(1);
    const stateB = new SignalState(1);

    const effectSpy = jest.fn();
    const cleanupSpy = jest.fn();
    const effect = new SignalEffectAsync(() => {
      effectSpy(stateA.value + stateB.value);
      return cleanupSpy;
    });

    stateA.value = 2;
    stateB.value = 2;

    effect.invalidate(true);
    expect(effectSpy.mock.calls).toStrictEqual([[2], [4]]);
    expect(cleanupSpy).toHaveBeenCalledTimes(1);
  });
});
