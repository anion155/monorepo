import { describe, expect, it } from "@jest/globals";

import { createNumberVector, NumberVectorComponents, VectorInvalid, VectorIteratingInvalid } from "./vector";

describe("Vector(length)", () => {
  it("should create vector class", () => {
    const V2 = createNumberVector(2);
    expect(V2).toStrictEqual(expect.any(Function));
    expect(V2.name).toBe("NumberVector(2)");
    expect(V2.prototype[Symbol.toStringTag]).toBe("NumberVector(2)");
    expect(V2.prototype.length).toBe(2);
  });

  it("should handle invalid length", () => {
    expect(() => createNumberVector(1)).toStrictThrow(new VectorInvalid("Invalid number vector length, must be more then 1"));
    expect(() => createNumberVector(2.5 as never)).toStrictThrow(new VectorInvalid("Invalid number vector length, must be integer"));
  });

  it("should create vector class with custom name", () => {
    const TestPoint = createNumberVector(2, { name: "TestPoint" });
    expect(TestPoint.name).toBe("TestPoint");
    expect(TestPoint.prototype[Symbol.toStringTag]).toBe("TestPoint");
  });

  function createPointClass() {
    interface TestPoint extends NumberVectorComponents<2> {}
    class TestPoint extends createNumberVector(2, { name: "TestPoint", parseTuple: (value: number) => [value, value] }) {}
    return TestPoint;
  }

  it("should provide number vector components", () => {
    const TestPoint = createPointClass();
    const point = new TestPoint(1, 2);
    expect(point).toBeInstanceOf(TestPoint);
    expect(point.length).toBe(2);
    expect(point[0]).toBe(1);
    expect(point.at(0)).toBe(1);
    expect(point[1]).toBe(2);
    expect(point.at(1)).toBe(2);
  });

  it("should instantiate", () => {
    const TestPoint = createPointClass();
    expect(new TestPoint(1)).toStrictEqual(new TestPoint(1, 1));
    expect(new TestPoint([1, 2])).toStrictEqual(new TestPoint(1, 2));
  });

  it("TestPoint.parseValue() should return isntance of TestPoint", () => {
    const TestPoint = createPointClass();
    const control1 = new TestPoint(1, 2);
    const control2 = new TestPoint(1, 1);
    expect(TestPoint.parseValue(control1)).toBe(control1);
    expect(TestPoint.parseValue({ length: 2, 0: 1, 1: 2 })).toStrictEqual(control1);
    expect(TestPoint.parseValue({ length: 2, 0: 1, 1: 2 })).not.toStrictEqual(control2);
    expect(TestPoint.parseValue([1, 2])).toStrictEqual(control1);
    expect(TestPoint.parseValue([1, 2])).not.toStrictEqual(control2);
    expect(TestPoint.parseValue(1)).not.toStrictEqual(control1);
    expect(TestPoint.parseValue(1)).toStrictEqual(control2);
  });

  it("TestPoint.iterators() should return isntance of TestPoint", () => {
    const TestPoint = createPointClass();
    const iterator = TestPoint.iterators(new TestPoint(1, 2), [2, 3], 4);
    expect(iterator.next()).toStrictEqual({ done: false, value: [1, 2, 4] });
    expect(iterator.next()).toStrictEqual({ done: false, value: [2, 3, 4] });
    expect(iterator.next()).toStrictEqual({ done: true, value: undefined });
  });

  it("TestPoint.iterators() should handle invalid values", () => {
    const TestPoint = createPointClass();
    for (const scalars of TestPoint.iterators(new TestPoint(1, 2), [2, 3], 4)) {
      expect(scalars).toStrictEqual([expect.any(Number), expect.any(Number), expect.any(Number)]);
    }
    expect.assertions(2);
  });

  it("TestPoint.project() should project vector", () => {
    const TestPoint = createPointClass();
    expect(TestPoint.project([1, 2])((value, index) => value * index)).toStrictEqual(new TestPoint(0, 2));
    expect(TestPoint.project(new TestPoint(1, 2), new TestPoint(3, 3))((a, b, index) => a + b + index)).toStrictEqual(new TestPoint(4, 6));
  });

  it(".toString() should return formated string", () => {
    const TestPoint = createPointClass();
    const point = new TestPoint(1, 2);
    expect(point.toString()).toBe("TestPoint [1, 2]");
  });

  it(".toJSON() should return tuple", () => {
    const TestPoint = createPointClass();
    const point = new TestPoint(1, 2);
    expect(point.toJSON()).toStrictEqual(["TestPoint", [1, 2]]);
  });

  it(".asTuple() should not change value, only type", () => {
    const TestPoint = createPointClass();
    const point = new TestPoint(1, 2);
    expect(point.asTuple()).toBe(point);
    expect(Array.isArray(point)).toBe(false);
    const fn = (a: number, b: number) => a + b;
    expect(fn(...point.asTuple())).toBe(3);
  });

  it(".toArray() should create array", () => {
    const TestPoint = createPointClass();
    const point = new TestPoint(1, 2);
    const array = point.toArray();
    expect(array).not.toBe(point);
    expect(array).toStrictEqual([1, 2]);
    expect(Array.isArray(array)).toBe(true);
    const fn = (a: number, b: number) => a + b;
    expect(fn(...array)).toBe(3);
  });

  it("[Symbol.iterator]() should return iterator", () => {
    const TestPoint = createPointClass();
    const iterator = new TestPoint(1, 2)[Symbol.iterator]();
    expect(iterator.next()).toStrictEqual({ done: false, value: 1 });
    expect(iterator.next()).toStrictEqual({ done: false, value: 2 });
    expect(iterator.next()).toStrictEqual({ done: true, value: undefined });
  });

  it("[Symbol.iterator]() should work if for", () => {
    const TestPoint = createPointClass();
    for (const scalars of new TestPoint(1, 2)) {
      expect(typeof scalars).toBe("number");
    }
    expect.assertions(2);
  });

  it(".equals() should compare vectors", () => {
    class TestPoint2 extends createNumberVector(2, { name: "TestPoint2" }) {}
    expect(new TestPoint2(1, 2).equals(new TestPoint2(1, 2))).toBe(true);
    expect(new TestPoint2(1, 2).equals(new TestPoint2(2, 3))).toBe(false);
    expect(new TestPoint2(1, 2).equals([2, 3])).toBe(false);
    class TestPoint4 extends createNumberVector(4, { name: "TestPoint4" }) {}
    expect(new TestPoint2(1, 2).equals(new TestPoint4(1, 2, 3, 4) as never)).toBe(true);
    expect(() => {
      return new TestPoint4(1, 2, 3, 4).equals(new TestPoint2(1, 2) as never);
    }).toStrictThrow(new VectorIteratingInvalid("Trying to iterate over invalid number vector"));
  });

  it(".add() should add a vector to b", () => {
    const TestPoint = createPointClass();
    expect(new TestPoint(1, 2).add(new TestPoint(2, 3))).toStrictEqual(new TestPoint(3, 5));
    expect(new TestPoint(1, 2).add(2)).toStrictEqual(new TestPoint(3, 4));
  });

  it(".sub() should subtract b vector from a", () => {
    const TestPoint = createPointClass();
    expect(new TestPoint(1, 2).sub(new TestPoint(2, 3))).toStrictEqual(new TestPoint(-1, -1));
    expect(new TestPoint(1, 2).sub(2)).toStrictEqual(new TestPoint(-1, 0));
  });

  it(".mul() should multiply a vector to b", () => {
    const TestPoint = createPointClass();
    expect(new TestPoint(1, 2).mul(new TestPoint(2, 3))).toStrictEqual(new TestPoint(2, 6));
    expect(new TestPoint(1, 2).mul(2)).toStrictEqual(new TestPoint(2, 4));
  });

  it(".div() should divide a vector by b", () => {
    const TestPoint = createPointClass();
    expect(new TestPoint(2, 4).div(new TestPoint(1, 2))).toStrictEqual(new TestPoint(2, 2));
    expect(new TestPoint(1, 2).div(2)).toStrictEqual(new TestPoint(0.5, 1));
  });

  it(".mod() should find reminder of divinding a vector by b", () => {
    const TestPoint = createPointClass();
    expect(new TestPoint(2, 5).mod(new TestPoint(1, 2))).toStrictEqual(new TestPoint(0, 1));
    expect(new TestPoint(5, 4).mod(2)).toStrictEqual(new TestPoint(1, 0));
  });
});
