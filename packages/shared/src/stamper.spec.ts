import { describe, expect, it, jest } from "@jest/globals";

import { DeveloperError } from "./errors";
import { Stamper } from "./stamper";

describe("Stamper utils", () => {
  it("should store stamped value", () => {
    const value = Object.freeze({});
    const stamper = new Stamper(() => 0);
    stamper.stamp(value, 5);
    expect(stamper.get(value)).toBe(5);
    stamper.set(value, 6);
    expect(stamper.get(value)).toBe(6);
    stamper.modify(value, (v) => v * 2);
    expect(stamper.get(value)).toBe(12);
  });

  it("should instantiate without init function", () => {
    const stamper = new Stamper();
    const f_value = Object.freeze({});
    const e_value = Object.freeze({});

    stamper.stamp(f_value, 5);
    expect(stamper.get(f_value)).toBe(5);

    expect(() => stamper.stamp(e_value)).toStrictThrow(new DeveloperError("init isn't declares in this Stamper"));
  });

  it(".stamp() should not change value", () => {
    const value = Object.freeze({});
    const stamper = new Stamper(() => 0);
    stamper.stamp(value);
    expect(value).toStrictEqual({});
  });

  it(".stamp() should throw TypeError on second stamp", () => {
    const value = Object.freeze({});
    const stamper = new Stamper(() => 0);
    stamper.stamp(value);
    expect(() => stamper.stamp(value)).toThrow(new TypeError("passed object was already stamped before"));
  });

  it(".get(), .set(), .modify() should throw TypeError if called before .stamp()", () => {
    const value = Object.freeze({});
    const stamper = new Stamper(() => 0);
    expect(() => stamper.get(value)).toThrow(new TypeError("passed object wasn't stamped"));
    expect(() => stamper.set(value, 5)).toThrow(new TypeError("passed object wasn't stamped"));
    expect(() => stamper.modify(value, (v) => v + 1)).toThrow(new TypeError("passed object wasn't stamped"));
  });

  it(".emplace() should stamp object if it wasn't already", () => {
    const stamper = new Stamper(() => 0);
    const s_value = Object.freeze({});
    const e_value = Object.freeze({});

    expect(stamper.has(e_value)).toBe(false);
    expect(stamper.emplace(e_value)).toBe(0);
    expect(stamper.has(e_value)).toBe(true);

    stamper.stamp(s_value, 1);
    expect(stamper.emplace(s_value)).toBe(1);
  });

  it(".getSafe(), .setSafe(), .modifySafe() should get value from stamped object and undefined from non stamped", () => {
    const stamper = new Stamper(() => 0);
    const s_value = Object.freeze({});
    const e_value = Object.freeze({});
    stamper.stamp(s_value, 5);

    expect(stamper.getSafe(s_value)).toBe(5);
    expect(stamper.getSafe(e_value)).toBeUndefined();

    stamper.setSafe(s_value, 6);
    expect(stamper.get(s_value)).toBe(6);
    stamper.setSafe(e_value, 6);

    const modify = jest.fn((v: number) => v + 1);

    stamper.modifySafe(s_value, modify);
    expect(modify).toHaveBeenCalledTimes(1);
    expect(stamper.get(s_value)).toBe(7);

    modify.mockClear();
    stamper.modifySafe(e_value, modify);
    expect(modify).not.toHaveBeenCalled();
  });

  it(".remove() should remove stored value", () => {
    const stamper = new Stamper(() => 0);
    const s_value = Object.freeze({});
    const e_value = Object.freeze({});
    stamper.stamp(s_value, 5);

    stamper.remove(s_value);
    expect(stamper.has(s_value)).toBe(false);

    stamper.remove(e_value);
  });
});
