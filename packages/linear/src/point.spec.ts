import { describe, expect, it } from "@jest/globals";

import { createPoint } from "./point";
import { NumberVectorScalars, VectorValueInvalid } from "./vector";

describe("createPoint(length)", () => {
  it("should create vector class", () => {
    const P2 = createPoint(2);
    expect(P2).toStrictEqual(expect.any(Function));
    expect(P2.name).toBe("Point(2)");
    expect(P2.prototype[Symbol.toStringTag]).toBe("Point(2)");
    expect(P2.prototype.length).toBe(2);
  });

  it("should handle unsupported value", () => {
    interface TestPoint extends NumberVectorScalars<2> {}
    class TestPoint extends createPoint(2, { name: "TestPoint" }) {}
    expect(() => TestPoint.parseValue("2" as never)).toStrictThrow(new VectorValueInvalid("Unsupported value"));
  });

  function createPoint2DClass() {
    interface TestPoint extends NumberVectorScalars<2> {}
    class TestPoint extends createPoint(2, { name: "TestPoint" }) {}
    return TestPoint;
  }

  it("should support one scalar value", () => {
    const TestPoint = createPoint2DClass();
    expect(new TestPoint(2)).toStrictEqual(new TestPoint(2, 2));
    expect(TestPoint.parseValue(2)).toStrictEqual(new TestPoint(2, 2));
  });

  it("Point.dot() should return scalar product of vectors", () => {
    const TestPoint = createPoint2DClass();
    expect(TestPoint.dot(new TestPoint(2, 3), [4, 5])).toBe(23);
    expect(TestPoint.dot(new TestPoint(1, 0), [0, 1])).toBe(0); // orthogonal vectors
  });

  it("this.dot() should return scalar product of vectors", () => {
    const TestPoint = createPoint2DClass();
    expect(new TestPoint(2, 3).dot([4, 5])).toBe(23);
    expect(new TestPoint(1, 0).dot([0, 1])).toBe(0); // orthogonal vectors
  });

  it("Point.magnitude() should return vectors magnitude", () => {
    const TestPoint = createPoint2DClass();
    expect(TestPoint.magnitude([1, 0])).toBe(1);
    expect(TestPoint.magnitude([0, 1])).toBe(1);
    expect(TestPoint.magnitude([3, 4])).toBe(5);
    expect(TestPoint.magnitude([-3, -4])).toBe(5);
    expect(TestPoint.magnitude([0, 0])).toBe(0);
    expect(TestPoint.magnitude([0.6, 0.8])).toBe(1);
  });

  it("this.magnitude() should return vectors magnitude", () => {
    const TestPoint = createPoint2DClass();
    expect(new TestPoint(0.6, 0.8).magnitude).toBe(1);
  });

  it("Point.andgle() should return angle between vectors in radians", () => {
    const TestPoint = createPoint2DClass();
    expect(TestPoint.andgle([1, 0], [0, 1])).toBe(Math.PI / 2);
    expect(TestPoint.andgle([1, 0], [1, 0])).toBe(0);
    expect(TestPoint.andgle([1, 0], [-1, 0])).toBe(Math.PI);
  });

  it("this.andgle() should return angle between vectors in radians", () => {
    const TestPoint = createPoint2DClass();
    expect(new TestPoint(1, 0).andgle([0, 1])).toBe(Math.PI / 2);
  });

  it("Point.distance() should return distance between vectors", () => {
    const TestPoint = createPoint2DClass();
    expect(TestPoint.distance([1, 0], [0, 1])).toBe(new TestPoint(1, 1).magnitude);
    expect(TestPoint.distance([2, 3], [2, 3])).toBe(0); // distance to self is zero
    expect(TestPoint.distance([3, 4], [0, 0])).toBe(5); // distance from origin
    expect(TestPoint.distance([1, 2], [4, 6])).toBe(new TestPoint(3, 4).magnitude); // distance between arbitrary points equals magnitude of their difference
  });

  it("this.distance() should return distance between vectors", () => {
    const TestPoint = createPoint2DClass();
    expect(new TestPoint(1, 2).distance([4, 6])).toBe(new TestPoint(3, 4).magnitude); // distance between arbitrary points equals magnitude of their difference
  });

  it("Point.normalize() should return distance between vectors", () => {
    const TestPoint = createPoint2DClass();
    expect(TestPoint.normalize([22, 0])).toStrictEqual(new TestPoint(1, 0));
    expect(TestPoint.normalize([3, 4])).toStrictEqual(new TestPoint(0.6, 0.8));
  });

  it("this.normalize() should return distance between vectors", () => {
    const TestPoint = createPoint2DClass();
    expect(new TestPoint(3, 4).normalize()).toStrictEqual(new TestPoint(0.6, 0.8));
  });

  it("this.normalize() should be cached", () => {
    const TestPoint = createPoint2DClass();
    const point = new TestPoint(3, 4);
    const first = point.normalize();
    const second = point.normalize();
    expect(first).toBe(second);
  });
});
