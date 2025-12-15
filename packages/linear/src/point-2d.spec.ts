import { describe, expect, it } from "@jest/globals";

import { Point2D, Point2DParams } from "./point-2d";
import { VectorIteratingInvalid } from "./vector";

describe("Point2D", () => {
  (
    [
      [
        [1, 2],
        [1, 2],
      ],
      [[[1, 2]], [1, 2]],
      [[{ x: 1, y: 2 }], [1, 2]],
      [[1], [1, 1]],
    ] as [Point2DParams, [number, number]][]
  ).forEach(([params, result]) =>
    it(`should instantiate Point with ${JSON.stringify(params)}`, () => {
      const point = new Point2D(...params);
      expect(point).toBeInstanceOf(Point2D);
      expect(point.x).toBe(result[0]);
      expect(point.y).toBe(result[1]);
    }),
  );

  it("should be strictly equal", () => {
    expect(new Point2D(5, 7)).toStrictEqual(new Point2D(5, 7));
  });

  it("should handle invalid param", () => {
    expect(() => new Point2D({} as never)).toStrictThrow(new VectorIteratingInvalid("Unsupported Point2D param"));
  });

  it(".magnitude should return vectors magnitude", () => {
    expect(new Point2D(1, 0).magnitude).toBe(1);
    expect(new Point2D(0, 1).magnitude).toBe(1);
    expect(new Point2D(3, 4).magnitude).toBe(5);
    expect(new Point2D(-3, -4).magnitude).toBe(5);
    expect(new Point2D(0, 0).magnitude).toBe(0);
    expect(new Point2D(0.6, 0.8).magnitude).toBe(1);
  });

  it(".distance() should return distance between vectors", () => {
    expect(new Point2D(1, 0).distance([0, 1])).toBe(new Point2D(1, 1).magnitude);
    expect(new Point2D(2, 3).distance([2, 3])).toBe(0); // distance to self is zero
    expect(new Point2D(3, 4).distance([0, 0])).toBe(5); // distance from origin
    expect(new Point2D(1, 2).distance([4, 6])).toBe(new Point2D(3, 4).magnitude); // distance between arbitrary points equals magnitude of their difference
  });

  it(".normalize() should return distance between vectors", () => {
    expect(new Point2D(22, 0).normalize()).toStrictEqual(new Point2D(1, 0));
    expect(new Point2D(3, 4).normalize()).toStrictEqual(new Point2D(0.6, 0.8));
  });

  it(".dot() should return scalar product of vectors", () => {
    expect(new Point2D(2, 3).dot([4, 5])).toBe(23);
    expect(new Point2D(1, 0).dot([0, 1])).toBe(0); // orthogonal vectors
  });

  it(".andgle() should return angle between vectors in radians", () => {
    expect(new Point2D(1, 0).andgle([0, 1])).toBe(Math.PI / 2);
    expect(new Point2D(1, 0).andgle([1, 0])).toBe(0);
    expect(new Point2D(1, 0).andgle([-1, 0])).toBe(Math.PI);
  });
});
