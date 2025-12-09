import { describe, expect, it } from "@jest/globals";

import { Point2D } from "./point-2d";
import { Rect, RectParams } from "./rect";
import { Size } from "./size";
import { VectorIteratingInvalid } from "./vector";

describe("Rect", () => {
  (
    [
      [
        [1, 2, 3, 4],
        [1, 2, 3, 4],
      ],
      [[[1, 2, 3, 4]], [1, 2, 3, 4]],
      [[{ x: 1, y: 2, width: 3, height: 4 }], [1, 2, 3, 4]],
      [[{ x: 1, y: 2, w: 3, h: 4 }], [1, 2, 3, 4]],
      [
        [
          [
            { x: 1, y: 2 },
            { width: 3, height: 4 },
          ],
        ],
        [1, 2, 3, 4],
      ],
      [
        [
          [
            { x: 1, y: 2 },
            { w: 3, h: 4 },
          ],
        ],
        [1, 2, 3, 4],
      ],
      [
        [
          { x: 1, y: 2 },
          { width: 3, height: 4 },
        ],
        [1, 2, 3, 4],
      ],
      [
        [
          { x: 1, y: 2 },
          { w: 3, h: 4 },
        ],
        [1, 2, 3, 4],
      ],
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

  it("should handle invalid param", () => {
    expect(() => new Rect(5 as never)).toStrictThrow(new VectorIteratingInvalid("Unsupported Rect param"));
  });

  it("should construct position and size", () => {
    const rect = new Rect(1, 2, 3, 4);
    expect(rect.position).toStrictEqual(new Point2D(1, 2));
    expect(rect.size).toStrictEqual(new Size(3, 4));
  });

  it("should cache position", () => {
    const rect = new Rect(1, 2, 3, 4);
    const first = rect.position;
    expect(rect.position).toBe(first);
  });

  it("should cache size", () => {
    const rect = new Rect(1, 2, 3, 4);
    const first = rect.size;
    expect(rect.size).toBe(first);
  });

  it(".expandBy() should expand rect by other rect", () => {
    let rect = new Rect(1, 2, 3, 4);
    rect = rect.expandBy([0, 0, 5, 7]);
    expect({ ...rect }).toStrictEqual({ ...new Rect(0, 0, 5, 7) });
    rect = new Rect(1, 2, 3, 4).expandBy([3, 3, 1, 1]);
    expect({ ...rect }).toStrictEqual({ ...new Rect(1, 2, 3, 4) });
  });
});
