import { describe, expect, it } from "@jest/globals";

import { boundParseValue, createNumberVector, NumberVectorScalars, VectorInvalid, VectorValueInvalid } from "./vector";

describe("createNumberVector(length)", () => {
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

  it("should handle unsupported value", () => {
    interface TestPoint extends NumberVectorScalars<2> {}
    class TestPoint extends createNumberVector(2, { name: "TestPoint" }) {}
    expect(() => TestPoint.parseValue(2 as never)).toStrictThrow(new VectorValueInvalid("Unsupported value"));
  });

  function createPoint2DClass() {
    interface TestPoint extends NumberVectorScalars<2> {}
    class TestPoint extends createNumberVector(2, {
      name: "TestPoint",
      parseTuple: (value: number) => {
        if (typeof value === "number") return [value, value];
        throw new VectorValueInvalid("test unsupported");
      },
    }) {}
    return TestPoint;
  }
  function createPoint4DClass() {
    interface TestPoint extends NumberVectorScalars<4> {}
    class TestPoint extends createNumberVector(4, {
      name: "TestPoint",
      parseTuple: (value: number) => {
        if (typeof value === "number") return [value, value, value, value];
        throw new VectorValueInvalid("test unsupported");
      },
    }) {}
    return TestPoint;
  }

  it("should provide number vector components", () => {
    const TestPoint = createPoint2DClass();
    const point = new TestPoint(1, 2);
    expect(point).toBeInstanceOf(TestPoint);
    expect(point.length).toBe(2);
    expect(point[0]).toBe(1);
    expect(point.at(0)).toBe(1);
    expect(point[1]).toBe(2);
    expect(point.at(1)).toBe(2);
  });

  it("should instantiate", () => {
    const TestPoint = createPoint2DClass();
    expect(new TestPoint(1)).toStrictEqual(new TestPoint(1, 1));
    expect(new TestPoint([1, 2])).toStrictEqual(new TestPoint(1, 2));
  });

  it("TestPoint.isValue() should detect value", () => {
    const TestPoint = createPoint2DClass();
    expect(TestPoint.isValue(new TestPoint(1, 2))).toBe(true);
    expect(TestPoint.isValue({ length: 2, 0: 1, 1: 2 })).toBe(true);
    expect(TestPoint.isValue({ length: "2", 0: 1, 1: 2 })).toBe(false);
    expect(TestPoint.isValue({ 0: 1, 1: 2 })).toBe(false);
    expect(TestPoint.isValue([1, 2])).toBe(true);
    expect(TestPoint.isValue([1, 2, 3])).toBe(false);
    expect(TestPoint.isValue([1])).toBe(false);
    expect(TestPoint.isValue(1)).toBe(true);
  });

  it("TestPoint.parseValue() should return isntance of TestPoint", () => {
    const TestPoint = createPoint2DClass();
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
    const TestPoint = createPoint2DClass();
    const iterator = TestPoint.iterators(new TestPoint(1, 2), [2, 3], 4);
    expect(iterator.next()).toStrictEqual({ done: false, value: [1, 2, 4] });
    expect(iterator.next()).toStrictEqual({ done: false, value: [2, 3, 4] });
    expect(iterator.next()).toStrictEqual({ done: true, value: undefined });
  });

  it("TestPoint.iterators() should handle invalid values", () => {
    const TestPoint = createPoint2DClass();
    for (const scalars of TestPoint.iterators(new TestPoint(1, 2), [2, 3], 4)) {
      expect(scalars).toStrictEqual([expect.any(Number), expect.any(Number), expect.any(Number)]);
    }
    expect.assertions(2);
  });

  it("TestPoint.project() should project vector", () => {
    const TestPoint = createPoint2DClass();
    expect(TestPoint.project([1, 2])(([value], index) => value * index)).toStrictEqual(new TestPoint(0, 2));
    expect(TestPoint.project(new TestPoint(1, 2), new TestPoint(3, 3))(([a, b], index) => a + b + index)).toStrictEqual(new TestPoint(4, 6));
  });

  it(".toString() should return formated string", () => {
    const TestPoint = createPoint2DClass();
    const point = new TestPoint(1, 2);
    expect(point.toString()).toBe("TestPoint [1, 2]");
  });

  it(".toJSON() should return tuple", () => {
    const TestPoint = createPoint2DClass();
    const point = new TestPoint(1, 2);
    expect(point.toJSON()).toStrictEqual(["TestPoint", [1, 2]]);
  });

  it(".asTuple() should not change value, only type", () => {
    const TestPoint = createPoint2DClass();
    const point = new TestPoint(1, 2);
    expect(point.asTuple()).toBe(point);
    expect(Array.isArray(point)).toBe(false);
    const fn = (a: number, b: number) => a + b;
    expect(fn(...point.asTuple())).toBe(3);
  });

  it(".as() should return wrapped value", () => {
    const TestPoint2 = createPoint2DClass();
    const TestPoint4 = createPoint4DClass();
    const source = new TestPoint4(1, 2, 3, 4);
    expect(() => new TestPoint2(1, 2).equals(source as never)).toStrictThrow(new VectorValueInvalid("test unsupported"));
    expect(TestPoint2.isValue(source)).toBe(false);
    const wrapped = source.as(2);
    expect(wrapped).not.toBe(source);
    expect(Object.getPrototypeOf(wrapped)).toBe(source);
    expect(wrapped.length).toBe(2);
    expect(new TestPoint2(1, 2).equals(wrapped)).toBe(true);
    expect(TestPoint2.isValue(wrapped)).toBe(true);
  });

  it(".toArray() should create array", () => {
    const TestPoint = createPoint2DClass();
    const point = new TestPoint(1, 2);
    const array = point.toArray();
    expect(array).not.toBe(point);
    expect(array).toStrictEqual([1, 2]);
    expect(Array.isArray(array)).toBe(true);
    const fn = (a: number, b: number) => a + b;
    expect(fn(...array)).toBe(3);
  });

  it("[Symbol.iterator]() should return iterator", () => {
    const TestPoint = createPoint2DClass();
    const iterator = new TestPoint(1, 2)[Symbol.iterator]();
    expect(iterator.next()).toStrictEqual({ done: false, value: 1 });
    expect(iterator.next()).toStrictEqual({ done: false, value: 2 });
    expect(iterator.next()).toStrictEqual({ done: true, value: undefined });
  });

  it("[Symbol.iterator]() should work in for", () => {
    const TestPoint = createPoint2DClass();
    for (const scalars of new TestPoint(1, 2)) {
      expect(typeof scalars).toBe("number");
    }
    expect.assertions(2);
  });

  it(".iterate() should return iterator", () => {
    const TestPoint = createPoint2DClass();
    const iterator = new TestPoint(1, 2).iterate();
    expect(iterator.next()).toStrictEqual({ done: false, value: 1 });
    expect(iterator.next()).toStrictEqual({ done: false, value: 2 });
    expect(iterator.next()).toStrictEqual({ done: true, value: undefined });
  });

  it("Vector.equals() should compare vectors", () => {
    const TestPoint2 = createPoint2DClass();
    expect(TestPoint2.equals([1, 2], new TestPoint2(1, 2))).toBe(true);
    expect(TestPoint2.equals(new TestPoint2(1, 2), new TestPoint2(2, 3))).toBe(false);
    expect(TestPoint2.equals([1, 2], [2, 3])).toBe(false);
    const TestPoint4 = createPoint4DClass();
    expect(() => TestPoint2.equals([1, 2], new TestPoint4(1, 2, 3, 4))).toStrictThrow(new VectorValueInvalid("test unsupported"));
    expect(TestPoint2.equals([1, 2], new TestPoint4(1, 2, 3, 4).as(2))).toBe(true);
  });

  it(".equals() should compare this vector to other", () => {
    const TestPoint2 = createPoint2DClass();
    expect(new TestPoint2(1, 2).equals(new TestPoint2(1, 2))).toBe(true);
    expect(new TestPoint2(1, 2).equals(new TestPoint2(2, 3))).toBe(false);
  });

  it("Vector.operate() should operate over scalars of all passed vectors", () => {
    const TestPoint = createPoint2DClass();
    expect(TestPoint.operate([1, 2], new TestPoint(2, 3), -1)((prev, curr) => prev + curr / 10)).toStrictEqual(
      new TestPoint(1 + 0.2 - 0.1, 2 + 0.3 - 0.1),
    );
  });

  it(".add() should add a vector to b", () => {
    const TestPoint = createPoint2DClass();
    expect(new TestPoint(1, 2).add(new TestPoint(2, 3))).toStrictEqual(new TestPoint(3, 5));
    expect(new TestPoint(1, 2).add(2)).toStrictEqual(new TestPoint(3, 4));
  });

  it("Vector.add() should add vectors", () => {
    const TestPoint = createPoint2DClass();
    expect(TestPoint.add(1, 2, 3)).toStrictEqual(new TestPoint(6, 6));
  });

  it(".sub() should subtract b vector from a", () => {
    const TestPoint = createPoint2DClass();
    expect(new TestPoint(1, 2).sub(new TestPoint(2, 3))).toStrictEqual(new TestPoint(-1, -1));
    expect(new TestPoint(1, 2).sub(2)).toStrictEqual(new TestPoint(-1, 0));
  });

  it("Vector.sub() should subtract vectors", () => {
    const TestPoint = createPoint2DClass();
    expect(TestPoint.sub(3, 2, 1)).toStrictEqual(new TestPoint(0, 0));
  });

  it(".mul() should multiply a vector to b", () => {
    const TestPoint = createPoint2DClass();
    expect(new TestPoint(1, 2).mul(new TestPoint(2, 3))).toStrictEqual(new TestPoint(2, 6));
    expect(new TestPoint(1, 2).mul(2)).toStrictEqual(new TestPoint(2, 4));
  });

  it("Vector.mul() should smultiplyub vectors", () => {
    const TestPoint = createPoint2DClass();
    expect(TestPoint.mul(3, 2, -1)).toStrictEqual(new TestPoint(-6, -6));
  });

  it(".div() should divide a vector by b", () => {
    const TestPoint = createPoint2DClass();
    expect(new TestPoint(2, 4).div(new TestPoint(1, 2))).toStrictEqual(new TestPoint(2, 2));
    expect(new TestPoint(1, 2).div(2)).toStrictEqual(new TestPoint(0.5, 1));
  });

  it("Vector.div() should divide vectors", () => {
    const TestPoint = createPoint2DClass();
    expect(TestPoint.div(3, 2, -1)).toStrictEqual(new TestPoint(-1.5, -1.5));
  });

  it(".mod() should find reminder of divinding a vector by b", () => {
    const TestPoint = createPoint2DClass();
    expect(new TestPoint(2, 5).mod(new TestPoint(1, 2))).toStrictEqual(new TestPoint(0, 1));
    expect(new TestPoint(5, 4).mod(2)).toStrictEqual(new TestPoint(1, 0));
  });

  it("Vector.mod() should sub vectors", () => {
    const TestPoint = createPoint2DClass();
    expect(TestPoint.div(3, 2, -1)).toStrictEqual(new TestPoint(-1.5, -1.5));
  });

  it("boundParseValue() should bind Vectors .parseValue() static method", () => {
    class TestPoint extends createPoint2DClass() {}
    const unbounded = TestPoint.parseValue as (value: unknown) => TestPoint;
    expect(() => unbounded(1)).toStrictThrow(new TypeError("Right-hand side of 'instanceof' is not an object"));
    const bounded = boundParseValue(TestPoint);
    expect(bounded(1)).toStrictEqual(new TestPoint(1, 1));
  });
});
