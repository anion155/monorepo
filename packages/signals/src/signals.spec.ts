import { is } from "@anion155/shared";
import { describe, expect, it, jest } from "@jest/globals";
import { SignalComputed } from "./computed";
import { SignalEffect } from "./effect";
import { Signal } from "./signal";
import { SignalState } from "./state";

describe("signals tests", () => {
  describe("Signal", () => {
    it("should dispose and return disposed state", () => {
      const stateA = new Signal();
      stateA.dispose();
      expect(stateA.disposed).toBe(true);
    });
  });

  describe("signals.state()", () => {
    it("should instantiate properly", () => {
      using stateA = new SignalState(1);
      expect(stateA).toBeInstanceOf(Signal);
      expect(is(stateA, Signal)).toBe(true);
    });

    it("should store state", () => {
      using stateA = new SignalState(1);
      expect(stateA.get()).toBe(1);
      stateA.set(2);
      expect(stateA.get()).toBe(2);
    });
  });

  describe("signals.effect()", () => {
    it("should instantiate properly", () => {
      using effect = new SignalEffect(() => {});
      expect(effect).toBeInstanceOf(Signal);
      expect(is(effect, Signal)).toBe(true);
    });

    it("should run effect on state change", async () => {
      using stateA = new SignalState(1);
      const cleanupSpy = jest.fn();
      const effectSpy = jest.fn(() => {
        stateA.get();
        return cleanupSpy;
      });
      using effect = new SignalEffect(effectSpy);
      await Promise.resolve();
      expect(cleanupSpy).toHaveBeenCalledTimes(0);
      expect(effectSpy).toHaveBeenCalledTimes(1);

      stateA.set(2);
      await Promise.resolve();
      expect(cleanupSpy).toHaveBeenCalledTimes(1);
      expect(effectSpy).toHaveBeenCalledTimes(2);

      stateA.set(3);
      stateA.set(4);
      stateA.set(5);
      await Promise.resolve();
      expect(cleanupSpy).toHaveBeenCalledTimes(2);
      expect(effectSpy).toHaveBeenCalledTimes(3);

      effect.dispose();
      expect(cleanupSpy).toHaveBeenCalledTimes(3);
      stateA.set(6);
      expect(effectSpy).toHaveBeenCalledTimes(3);
    });

    it("should not call effect after dispose", async () => {
      using stateA = new SignalState(1);
      const cleanupSpy = jest.fn();
      const effectSpy = jest.fn(() => {
        stateA.get();
        return cleanupSpy;
      });
      using effect = new SignalEffect(effectSpy);
      await Promise.resolve();

      stateA.set(2);
      effect.dispose();
      await Promise.resolve();
      expect(cleanupSpy).toHaveBeenCalledTimes(1);
      expect(effectSpy).toHaveBeenCalledTimes(1);
    });

    it("should run effect synchronously", async () => {
      using stateA = new SignalState(1);
      const cleanupSpy = jest.fn();
      const effectSpy = jest.fn(() => {
        stateA.get();
        return cleanupSpy;
      });
      using effect = new SignalEffect(effectSpy, true);
      expect(cleanupSpy).toHaveBeenCalledTimes(0);
      expect(effectSpy).toHaveBeenCalledTimes(1);

      stateA.set(2);
      expect(cleanupSpy).toHaveBeenCalledTimes(1);
      expect(effectSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe("signals.computed()", () => {
    it("should instantiate properly", () => {
      using computed = new SignalComputed(() => {});
      expect(computed).toBeInstanceOf(Signal);
      expect(is(computed, Signal)).toBe(true);
    });

    it("should update value on state change", async () => {
      using stateA = new SignalState(1);
      using computed = new SignalComputed(() => stateA.get() * 2);
      expect(computed.get()).toBe(2);

      const effectSpy = jest.fn((_n: number) => undefined);
      using effect = new SignalEffect(() => effectSpy(computed.get()), true);
      effectSpy.mockClear();

      stateA.set(2);
      expect(computed.get()).toBe(4);
      expect(effectSpy).toHaveBeenCalledTimes(1);
    });

    it("without setter .set() should throw TypeError", async () => {
      using stateA = new SignalState(1);
      using computed = new SignalComputed(() => stateA.get() * 2);

      expect(() => computed.set(2)).toThrow(new TypeError("this computed signal is readonly"));
    });

    it("should update state", async () => {
      using stateA = new SignalState(1);
      using computed = new SignalComputed(
        () => stateA.get() * 2,
        (value) => stateA.set(value / 2),
      );

      const effectSpy = jest.fn((_n: number) => undefined);
      using effect = new SignalEffect(() => effectSpy(computed.get()), true);

      computed.set(4);
      expect(stateA.get()).toBe(2);
      expect;
    });
  });
});
