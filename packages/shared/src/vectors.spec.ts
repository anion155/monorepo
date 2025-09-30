import { describe, expect, it } from "@jest/globals";

import type { PointParams, RectParams, SizeParams } from "./vectors";
import { Point, Rect, Size, Vector } from "./vectors";

describe("vectors utils", () => {
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

  describe("Size", () => {
    (
      [
        [
          [1, 2],
          [1, 2],
        ],
        [[{ w: 1, h: 2 }], [1, 2]],
        [[{ width: 1, height: 2 }], [1, 2]],
        [[[1, 2]], [1, 2]],
      ] as [SizeParams, [number, number]][]
    ).forEach(([args, result]) =>
      it(`should instantiate Size with ${JSON.stringify(args)}`, () => {
        const size = new Size(...args);
        expect(size).toBeInstanceOf(Size);
        expect(size.w).toBe(result[0]);
        expect(size.width).toBe(result[0]);
        expect(size.h).toBe(result[1]);
        expect(size.height).toBe(result[1]);
      }),
    );
  });

  describe("Rect", () => {
    (
      [
        [
          [1, 2, 3, 4],
          [1, 2, 3, 4],
        ],
        [[{ x: 1, y: 2, width: 3, height: 4 }], [1, 2, 3, 4]],
        [
          [
            { x: 1, y: 2 },
            { width: 3, height: 4 },
          ],
          [1, 2, 3, 4],
        ],
        [[[1, 2, 3, 4]], [1, 2, 3, 4]],
      ] as [RectParams, [number, number, number, number]][]
    ).forEach(([args, result]) =>
      it(`should instantiate Rect with ${JSON.stringify(args)}`, () => {
        const rect = new Rect(...args);
        expect(rect).toBeInstanceOf(Rect);
        expect(rect.x).toBe(result[0]);
        expect(rect.y).toBe(result[1]);
        expect(rect.width).toBe(result[2]);
        expect(rect.w).toBe(result[2]);
        expect(rect.height).toBe(result[3]);
        expect(rect.h).toBe(result[3]);
      }),
    );
  });
});
