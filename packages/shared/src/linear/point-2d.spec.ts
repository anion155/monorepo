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

  it("should handle invalid param", () => {
    expect(() => new Point2D({} as never)).toStrictThrow(new VectorIteratingInvalid("Unsupported Point2D param"));
  });
});
