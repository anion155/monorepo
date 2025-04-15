import { is } from "@anion155/shared";
import { describe, expect, it, jest } from "@jest/globals";

import {
  CircularDependencyError,
  Signal,
  SignalEffect,
  SignalEffectAsync,
  SignalReadonlyComputed,
  SignalState,
  SignalWritableComputed,
} from "./index";

describe("signals tests", () => {
  describe("Signal", () => {
    it("should dispose and return disposed state", () => {
      const stateA = new Signal();
      stateA.dispose();
      expect(stateA.disposed).toBe(true);
    });

    it("should throw CircularDependencyError", () => {
      const state = new SignalState(5);
      // eslint-disable-next-line prefer-const
      let compC: SignalReadonlyComputed<number>;
      const compA = new SignalReadonlyComputed(() => compC?.value);
      const compB = new SignalReadonlyComputed(() => (state.value > 6 ? compA.value : 6));
      compC = new SignalReadonlyComputed(() => compB.value);
      compA[Symbol.invalidate]();
      expect(() => {
        state.value = 7;
      }).toThrow(new CircularDependencyError());
    });

    it("disposed signal should dispose it's listeners", () => {
      const state = new SignalState(5);
      const computed = new SignalReadonlyComputed(() => state.get() + 1);
      const effect = new SignalEffect(() => {
        void state.get();
      });

      expect(state.disposed).toBe(false);
      expect(computed.disposed).toBe(false);
      expect(effect.disposed).toBe(false);

      state.dispose();

      expect(state.disposed).toBe(true);
      expect(computed.disposed).toBe(true);
      expect(effect.disposed).toBe(true);
    });

    it("value field should serve as wrapper to get/set methods", () => {
      const state = new SignalState(5);
      const computed = new SignalReadonlyComputed(() => String(state.value));

      expect(computed.value).toBe("5");
      state.value = 6;
      expect(computed.value).toBe("6");
    });

    it(".toJSON() should return underlying value", () => {
      const state = new SignalState(5);
      expect(JSON.stringify(state)).toBe("5");
    });

    it(".valueOf() should return underlying value", () => {
      const state = new SignalState(5);
      expect(10 + (state as unknown as number)).toBe(15);
    });

    it(".toString() should convert underlying value to string", () => {
      const state = new SignalState(5);
      expect(`gg-${state as unknown as string}`).toBe("gg-5");
    });

    it(".update() should pass current value to modifier and set result", () => {
      const state = new SignalState(5);
      state.update((current) => 10 + current);
      expect(state.get()).toBe(15);
    });
  });

  describe("new SignalState()", () => {
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

  describe("new SignalEffect()", () => {
    it("should instantiate properly", () => {
      using effect = new SignalEffect(() => {});
      expect(effect).toBeInstanceOf(Signal);
      expect(is(effect, Signal)).toBe(true);
    });

    it("should run effect on state change", () => {
      using stateA = new SignalState(1);
      const cleanupSpy = jest.fn();
      const effectSpy = jest.fn(() => {
        stateA.get();
        return cleanupSpy;
      });
      using effect = new SignalEffect(effectSpy);
      expect(cleanupSpy).toHaveBeenCalledTimes(0);
      expect(effectSpy).toHaveBeenCalledTimes(1);

      stateA.set(2);
      expect(cleanupSpy).toHaveBeenCalledTimes(1);
      expect(effectSpy).toHaveBeenCalledTimes(2);

      stateA.set(3);
      expect(cleanupSpy).toHaveBeenCalledTimes(2);
      expect(effectSpy).toHaveBeenCalledTimes(3);

      effect.dispose();
      expect(cleanupSpy).toHaveBeenCalledTimes(3);
      stateA.set(6);
      expect(effectSpy).toHaveBeenCalledTimes(3);
    });

    it("should not call effect after dispose", () => {
      using stateA = new SignalState(1);
      const cleanupSpy = jest.fn();
      const effectSpy = jest.fn(() => {
        stateA.get();
        return cleanupSpy;
      });
      using effect = new SignalEffect(effectSpy);

      effect.dispose();
      stateA.set(2);
      expect(cleanupSpy).toHaveBeenCalledTimes(1);
      expect(effectSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("new SignalEffectAsync()", () => {
    it("should instantiate properly", () => {
      using effect = new SignalEffectAsync(() => {});
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
      using effect = new SignalEffectAsync(effectSpy);
      expect(cleanupSpy).toHaveBeenCalledTimes(0);
      expect(effectSpy).toHaveBeenCalledTimes(1);

      stateA.set(2);
      expect(cleanupSpy).toHaveBeenCalledTimes(0);
      expect(effectSpy).toHaveBeenCalledTimes(1);
      await Promise.resolve();
      expect(cleanupSpy).toHaveBeenCalledTimes(1);
      expect(effectSpy).toHaveBeenCalledTimes(2);

      stateA.set(3);
      stateA.set(4);
      stateA.set(5);
      expect(cleanupSpy).toHaveBeenCalledTimes(1);
      expect(effectSpy).toHaveBeenCalledTimes(2);
      await Promise.resolve();
      expect(cleanupSpy).toHaveBeenCalledTimes(2);
      expect(effectSpy).toHaveBeenCalledTimes(3);

      stateA.set(6);
      effect.dispose();
      stateA.set(7);
      expect(cleanupSpy).toHaveBeenCalledTimes(3);
      expect(effectSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe("new SignalReadonlyComputed()", () => {
    it("should instantiate properly", () => {
      using computed = new SignalReadonlyComputed(() => {});
      expect(computed).toBeInstanceOf(Signal);
      expect(is(computed, Signal)).toBe(true);
    });

    it("should update value on state change", () => {
      using stateA = new SignalState(1);
      using computed = new SignalReadonlyComputed(() => stateA.get() * 2);
      expect(computed.get()).toBe(2);

      const effectSpy = jest.fn((_n: number) => undefined);
      using _effect = new SignalEffect(() => effectSpy(computed.get()));
      effectSpy.mockClear();

      stateA.set(2);
      expect(computed.get()).toBe(4);
      expect(effectSpy).toHaveBeenCalledTimes(1);
    });

    it("should ignore .peak() call", () => {
      using stateA = new SignalState(1);
      using computed = new SignalReadonlyComputed(() => stateA.get() * 2);
      expect(computed.get()).toBe(2);

      const effectSpy = jest.fn((_n: number) => undefined);
      using _effect = new SignalEffect(() => effectSpy(computed.peak()));
      effectSpy.mockClear();

      stateA.set(2);
      expect(computed.get()).toBe(4);
      expect(effectSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe("new SignalWritableComputed()", () => {
    it("should instantiate properly", () => {
      using computed = new SignalWritableComputed(
        () => {},
        () => {},
      );
      expect(computed).toBeInstanceOf(Signal);
      expect(is(computed, Signal)).toBe(true);
    });

    it("should update value on state change", () => {
      using stateA = new SignalState(1);
      using computed = new SignalWritableComputed(
        () => stateA.get() * 2,
        (value) => stateA.set(value / 2),
      );
      expect(computed.get()).toBe(2);

      const effectSpy = jest.fn((_n: number) => undefined);
      using _effect = new SignalEffect(() => effectSpy(computed.get()));
      effectSpy.mockClear();

      stateA.set(2);
      expect(computed.get()).toBe(4);
      expect(effectSpy).toHaveBeenCalledTimes(1);
    });

    it("should ignore .peak() call", () => {
      using stateA = new SignalState(1);
      using computed = new SignalWritableComputed(
        () => stateA.get() * 2,
        (value) => stateA.set(value / 2),
      );
      expect(computed.get()).toBe(2);

      const effectSpy = jest.fn((_n: number) => undefined);
      using _effect = new SignalEffect(() => effectSpy(computed.peak()));
      effectSpy.mockClear();

      stateA.set(2);
      expect(computed.get()).toBe(4);
      expect(effectSpy).toHaveBeenCalledTimes(0);
    });

    it("should update state", () => {
      using stateA = new SignalState(1);
      using computed = new SignalWritableComputed(
        () => stateA.get() * 2,
        (value) => stateA.set(value / 2),
      );

      const effectSpy = jest.fn((_n: number) => undefined);
      using _effect = new SignalEffect(() => effectSpy(computed.get()));

      computed.set(4);
      expect(stateA.get()).toBe(2);
    });
  });
});
