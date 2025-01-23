import { describe, expect, it, jest } from "@jest/globals";
import {
  appendMethod,
  appendProperties,
  appendProperty,
  assignProperties,
  create,
  defineMethod,
  defineProperties,
  defineProperty,
  getOwnProperty,
  getProperty,
  modifyMethod,
  modifyProperty,
  updateProperty,
} from "./object";

describe("object utils", () => {
  describe("getOwnProperty()", () => {
    it("should return own property descriptor", () => {
      const obj = Object.create({ a: 1 }, { b: { value: 2 } }) as { a: number; b: number };
      expect(getOwnProperty(obj, "b")).toStrictEqual({ value: 2, writable: false, enumerable: false, configurable: false });
      expect(getOwnProperty(obj, "a")).toBeUndefined();
      expect(getOwnProperty(obj, "c" as never)).toBeUndefined();
    });
  });

  describe("getProperty()", () => {
    it("should return property descriptor", () => {
      const obj = Object.create({ a: 1 }, { b: { value: 2 } }) as { a: number; b: number };
      expect(getProperty(obj, "b")).toStrictEqual({ value: 2, writable: false, enumerable: false, configurable: false });
      expect(getProperty(obj, "a")).toStrictEqual({ value: 1, writable: true, enumerable: true, configurable: true });
      expect(getProperty(obj, "c" as never)).toBeUndefined();
    });
  });

  describe("defineProperty()", () => {
    it("should define property in object", () => {
      const obj = {} as { a: number };
      defineProperty(obj, "a", { value: 1 });
      expect(obj.a).toBe(1);
      expect({ ...obj }).toStrictEqual({ a: 1 });
      obj.a = 2;
      expect(obj.a).toBe(2);
    });

    it("should define accessor property in object", () => {
      const obj = {} as { a: number };
      const set = jest.fn();
      defineProperty(obj, "a", { get: () => 1, set });
      expect(obj.a).toBe(1);
      expect({ ...obj }).toStrictEqual({ a: 1 });
      obj.a = 2;
      expect(set).toHaveBeenCalledWith(2);
    });
  });

  describe("defineMethod()", () => {
    it("should define method in object", () => {
      const obj = {} as { test(): number };
      defineMethod(obj, "test", () => 5);
      expect(obj.test()).toBe(5);
      expect({ ...obj }).toStrictEqual({});
    });
  });

  describe("defineProperties()", () => {
    it("should define properties", () => {
      const obj = {} as { a: number; b: number; test(): number };
      const test = () => 5;
      defineProperties(obj, {
        a: 1,
        get b() {
          return 2;
        },
        set b(value: number) {},
        test,
      });
      expect(obj.test()).toBe(5);
      expect({ ...obj }).toStrictEqual({ a: 1, b: 2 });
    });

    it("should only pass own properties", () => {
      const obj = {} as { a: number; b: number };
      const proto = { a: 1 };
      const values = Object.create(proto, { b: { value: 2 } }) as object;
      defineProperties(obj, values);
      expect(Object.getOwnPropertyDescriptor(obj, "a")).toBeUndefined();
    });
  });

  describe("appendProperty()", () => {
    it("should append property to the object", () => {
      const obj = {};
      appendProperty(obj, "a", { value: 1 });
      expect(obj.a).toBe(1);
    });
  });

  describe("appendMethod()", () => {
    it("should append method to the object", () => {
      const obj = {};
      appendMethod(obj, "test", () => 1);
      expect(obj.test()).toBe(1);
    });
  });

  describe("appendProperties()", () => {
    it("should append properties to the object", () => {
      const obj = {};
      appendProperties(obj, { a: 1, test: () => 2 });
      expect(obj.a).toBe(1);
      expect(obj.test()).toBe(2);
    });
  });

  describe("modifyProperty()", () => {
    it("should modify property in object", () => {
      const obj = { a: 1 };
      modifyProperty(obj, "a", (desc) => ({ ...desc, value: 2 }));
      expect(obj.a).toBe(2);
    });
  });

  describe("modifyMethod()", () => {
    it("should modify method in object", () => {
      const test = () => 1;
      const obj = { test };
      modifyMethod(obj, "test", (orig) => () => orig() * 10);
      expect(obj.test()).toBe(10);
    });
  });

  describe("updateProperty()", () => {
    it("should update property descriptor", () => {
      const obj = { a: 1 };
      updateProperty(obj, "a", { enumerable: false });
      expect({ ...obj }).toStrictEqual({});
    });
  });

  describe("assignProperties()", () => {
    it("should assign properties to object", () => {
      const test = () => 3;
      const obj = assignProperties({ a: 1 }, { b: 2, test });
      expect({ ...obj }).toStrictEqual({ a: 1, b: 2 });
      expect(obj.test()).toBe(3);
    });
  });

  describe("create()", () => {
    it("should create object with proto prototype and properties from values", () => {
      const proto = { a: 1 };
      const test = () => 3;
      const obj = create(proto, { b: 2, test });
      expect({ ...obj }).toStrictEqual({ b: 2 });
      expect(obj.a).toBe(1);
      expect(obj.test()).toBe(3);
    });
  });
});
