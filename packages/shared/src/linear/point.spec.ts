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
});
