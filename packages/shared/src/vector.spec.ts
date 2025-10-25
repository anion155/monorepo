import { describe, expect, it } from "@jest/globals";

import { Vector } from "./vector";

describe("Vector(length)", () => {
  it("should create vector class", () => {
    const V2 = Vector(2);
    expect(V2).toStrictEqual(expect.any(Function));
    expect(V2.name).toBe("Vector(2)");
    expect(V2.prototype[Symbol.toStringTag]).toBe("Vector(2)");
    expect(V2.prototype.length).toBe(2);
  });

  it("should create vector class with custom name", () => {
    const TestPoint = Vector(2, "TestPoint");
    expect(TestPoint.name).toBe("TestPoint");
    expect(TestPoint.prototype[Symbol.toStringTag]).toBe("TestPoint");
  });

  it("should instantiate vector", () => {
    const TestPoint = Vector(2, "TestPoint");
    const point = new TestPoint(1, 2);
    expect(point).toBeInstanceOf(TestPoint);
    expect(point.toString()).toBe("TestPoint [1, 2]");
    expect(point[0]).toBe(1);
    expect(point[1]).toBe(2);
    {
      const [a, b] = point;
      expect(a).toBe(1);
      expect(b).toBe(2);
    }
  });

  it("should spread vector", () => {
    const TestPoint = Vector(2, "TestPoint");
    const point = new TestPoint(1, 2);
    const fn = (a: number, b: number) => a + b;
    expect([...point]).toStrictEqual([1, 2]);
    expect(fn(...point._)).toBe(3);
  });

  it("should not let change length", () => {
    const TestPoint = Vector(2, "TestPoint");
    const point = new TestPoint(1, 2);
    expect(() => (point as unknown as number[]).push(3)).toStrictThrow(
      new TypeError("Cannot assign to read only property 'length' of object '[object TestPoint]'"),
    );
    expect(() => (point as unknown as number[]).pop()).toStrictThrow(
      new TypeError("Cannot assign to read only property 'length' of object '[object TestPoint]'"),
    );
  });

  it("should not let change values", () => {
    const TestPoint = Vector(2, "TestPoint");
    const point = new TestPoint(1, 2);
    expect(() => {
      (point as unknown as number[])[1] = 3;
    }).toStrictThrow(new TypeError("Cannot assign to read only property '1' of object '[object TestPoint]'"));
  });

  function createPointClass() {
    return class TestPoint extends Vector(2, "TestPoint") {
      static parseParams(point: TestPoint) {
        return point;
      }
    };
  }

  it("Vector.projectScalars() should project vector's scalars", () => {
    const TestPoint = createPointClass();
    const a = new TestPoint(1, 2);
    const b = new TestPoint(2, 3);
    expect(TestPoint.projectScalars(a, (value) => value * 2)).toStrictEqual([2, 4]);
    expect(TestPoint.projectScalars(a, b, (a, b) => a + b)).toStrictEqual([3, 5]);
  });

  it("Vector.project() should project vector", () => {
    const TestPoint = createPointClass();
    const a = new TestPoint(1, 2);
    const b = new TestPoint(2, 3);
    expect(TestPoint.project(a, (value) => value * 2)).toStrictEqual(new TestPoint(2, 4));
    expect(TestPoint.project(a, b, (a, b) => a + b)).toStrictEqual(new TestPoint(3, 5));
  });

  it("Vector.project() should require parseParams() static method", () => {
    const TestPoint = Vector(2, "TestPoint");
    const point = new TestPoint(1, 2);
    // @ts-expect-error - incorrect types
    expect(() => TestPoint.project(point, (value) => value * 2)).toStrictThrow(new TypeError("this.parseParams is not a function"));
  });

  it("Vector.add() should add a vector to b", () => {
    const TestPoint = createPointClass();
    const a = new TestPoint(1, 2);
    const b = new TestPoint(2, 3);
    expect(TestPoint.add(a, b)).toStrictEqual(new TestPoint(3, 5));
  });

  it("Vector.sub() should subtract b vector from a", () => {
    const TestPoint = createPointClass();
    const a = new TestPoint(1, 2);
    const b = new TestPoint(2, 3);
    expect(TestPoint.sub(a, b)).toStrictEqual(new TestPoint(-1, -1));
  });

  it("Vector.mul() should multiply a vector to b", () => {
    const TestPoint = createPointClass();
    const a = new TestPoint(1, 2);
    const b = new TestPoint(2, 3);
    expect(TestPoint.mul(a, b)).toStrictEqual(new TestPoint(2, 6));
  });

  it("Vector.div() should divide a vector by b", () => {
    const TestPoint = createPointClass();
    const a = new TestPoint(5, 6);
    const b = new TestPoint(2, 3);
    expect(TestPoint.div(a, b)).toStrictEqual(new TestPoint(2.5, 2));
  });

  it("Vector.mod() should find reminder of divinding a vector by b", () => {
    const TestPoint = createPointClass();
    const a = new TestPoint(5, 6);
    const b = new TestPoint(2, 3);
    expect(TestPoint.mod(a, b)).toStrictEqual(new TestPoint(1, 0));
  });
});
