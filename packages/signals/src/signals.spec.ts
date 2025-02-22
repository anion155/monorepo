import { describe, expect, it, jest } from "@jest/globals";
import { Signal, SignalEffect, signals, SignalState } from "./signals";

describe("signals tests", () => {
  describe("Signal", () => {
    it("should dispose and return disposed state", () => {
      const stateA = signals.state(1);
      stateA.dispose();
      expect(stateA.disposed).toBe(true);
    });
  });

  describe("signals.state()", () => {
    it("should instantiate properly", () => {
      using stateA = signals.state(1);
      expect(stateA).toBeInstanceOf(SignalState);
      expect(stateA).toBeInstanceOf(Signal);
      expect(signals.is(stateA)).toBe(true);
    });

    it("should store state", () => {
      using stateA = signals.state(1);
      expect(stateA.get()).toBe(1);
      stateA.set(2);
      expect(stateA.get()).toBe(2);
    });
  });

  describe("signals.effect()", () => {
    it("should instantiate properly", () => {
      using effect = signals.effect(() => {});
      expect(effect).toBeInstanceOf(SignalEffect);
      expect(effect).toBeInstanceOf(Signal);
      expect(signals.is(effect)).toBe(true);
    });

    it("should run effect on state change", async () => {
      using stateA = signals.state(1);
      const cleanupSpy = jest.fn();
      const effectSpy = jest.fn(() => {
        stateA.get();
        return cleanupSpy;
      });
      using effect = signals.effect(effectSpy);
      await Promise.resolve();
      expect(cleanupSpy).toHaveBeenCalledTimes(0);
      expect(effectSpy).toHaveBeenCalledTimes(1);

      stateA.set(2);
      await Promise.resolve();
      expect(cleanupSpy).toHaveBeenCalledTimes(1);
      expect(effectSpy).toHaveBeenCalledTimes(2);

      effect.dispose();
      expect(cleanupSpy).toHaveBeenCalledTimes(2);
      stateA.set(3);
      expect(effectSpy).toHaveBeenCalledTimes(2);
    });

    it("should not call effect after dispose", async () => {
      using stateA = signals.state(1);
      const cleanupSpy = jest.fn();
      const effectSpy = jest.fn(() => {
        stateA.get();
        return cleanupSpy;
      });
      using effect = signals.effect(effectSpy);
      await Promise.resolve();

      stateA.set(2);
      effect.dispose();
      await Promise.resolve();
      expect(cleanupSpy).toHaveBeenCalledTimes(1);
      expect(effectSpy).toHaveBeenCalledTimes(1);
    });

    it("should run effect synchronously", async () => {
      using stateA = signals.state(1);
      const cleanupSpy = jest.fn();
      const effectSpy = jest.fn(() => {
        stateA.get();
        return cleanupSpy;
      });
      using effect = signals.effect(effectSpy, true);
      expect(cleanupSpy).toHaveBeenCalledTimes(0);
      expect(effectSpy).toHaveBeenCalledTimes(1);

      stateA.set(2);
      expect(cleanupSpy).toHaveBeenCalledTimes(1);
      expect(effectSpy).toHaveBeenCalledTimes(2);
    });
  });
});
