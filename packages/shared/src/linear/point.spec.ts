import { describe, expect, it } from "@jest/globals";

import { Point, PointParams } from "./point";

describe("Point", () => {
  (
    [
      [
        [1, 2],
        [1, 2],
      ],
      [[{ x: 1, y: 2 }], [1, 2]],
      [[[1, 2]], [1, 2]],
    ] as [PointParams, [number, number]][]
  ).forEach(([args, result]) =>
    it(`should instantiate Point with ${JSON.stringify(args)}`, () => {
      const point = new Point(...args);
      expect(point).toBeInstanceOf(Point);
      expect(point.x).toBe(result[0]);
      expect(point.y).toBe(result[1]);
    }),
  );

  it("Point.parseValue() should return point or create new one", () => {
    const point = new Point(0, 1);
    expect(Point.parseValue(point)).toBe(point);
    expect(Point.parseValue([0, 1])).toStrictEqual(point);
  });

  it(".add() should add another point or scalar", () => {
    const point = new Point(0, 1);
    expect(point.add(new Point(2, 3))).toStrictEqual(new Point(2, 4));
    expect(point.add(new Point(4))).toStrictEqual(new Point(4, 5));
  });

  it(".sub() should sub another point or scalar", () => {
    const point = new Point(0, 1);
    expect(point.sub(new Point(2, 3))).toStrictEqual(new Point(-2, -2));
    expect(point.sub(new Point(4))).toStrictEqual(new Point(-4, -3));
  });

  it(".mul() should mul by another point or scalar", () => {
    const point = new Point(0, 1);
    expect(point.mul(new Point(2, 3))).toStrictEqual(new Point(0, 3));
    expect(point.mul(new Point(4))).toStrictEqual(new Point(0, 4));
  });

  it(".div() should div another point or scalar", () => {
    const point = new Point(10, 9);
    expect(point.div(new Point(2, 3))).toStrictEqual(new Point(5, 3));
    expect(point.div(new Point(4))).toStrictEqual(new Point(2.5, 2.25));
  });
});
