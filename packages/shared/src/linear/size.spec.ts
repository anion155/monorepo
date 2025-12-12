import { describe, expect, it } from "@jest/globals";

import { Size, SizeParams } from "./size";
import { VectorIteratingInvalid } from "./vector";

describe("Size", () => {
  (
    [
      [
        [1, 2],
        [1, 2],
      ],
      [[[1, 2]], [1, 2]],
      [[{ w: 1, h: 2 }], [1, 2]],
      [[{ width: 1, height: 2 }], [1, 2]],
      [[1], [1, 1]],
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

  it("should be strictly equal", () => {
    expect(new Size(5, 7)).toStrictEqual(new Size(5, 7));
  });

  it("should handle invalid param", () => {
    expect(() => new Size({} as never)).toStrictThrow(new VectorIteratingInvalid("Unsupported Size param"));
  });
});
