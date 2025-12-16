import { describe, expect, it } from "@jest/globals";

import { Point2D, Point2DParams, Point3D, Point3DParams } from "./points";
import { VectorIteratingInvalid } from "./vector";

describe("points module", () => {
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
  });

  describe("Point3D", () => {
    (
      [
        [
          [1, 2, 3],
          [1, 2, 3],
        ],
        [[[1, 2, 3]], [1, 2, 3]],
        [[{ x: 1, y: 2, z: 3 }], [1, 2, 3]],
        [[1], [1, 1, 1]],
      ] as [Point3DParams, [number, number, number]][]
    ).forEach(([params, result]) =>
      it(`should instantiate Point with ${JSON.stringify(params)}`, () => {
        const point = new Point3D(...params);
        expect(point).toBeInstanceOf(Point3D);
        expect(point.x).toBe(result[0]);
        expect(point.y).toBe(result[1]);
        expect(point.z).toBe(result[2]);
      }),
    );

    it("should be strictly equal", () => {
      expect(new Point3D(5, 7, 1)).toStrictEqual(new Point3D(5, 7, 1));
    });

    it("should handle invalid param", () => {
      expect(() => new Point3D({} as never)).toStrictThrow(new VectorIteratingInvalid("Unsupported Point3D param"));
    });
  });
});
