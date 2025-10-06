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
});
