import { cached } from "../decorators";
import type { VectorArray } from "../vector";
import { Vector } from "../vector";
import type { PointObject, PointValue } from "./point";
import { Point } from "./point";
import type { SizeObject, SizeShortObject, SizeValue } from "./size";
import { Size } from "./size";

export type RectObject = PointObject & SizeObject;

/** Rect class. */
export class Rect extends Vector(4, "Rect") implements PointObject, SizeObject, SizeShortObject {
  /** Parses {@link RectParams} into tuple of 4 numbers */
  static parse(...params: RectParams): VectorArray<4> {
    if (params.length === 4) return params;
    if (params.length === 2) return [...Point.parse(params[0]), ...Size.parse(params[1])];
    if ("x" in params[0]) return [params[0].x, params[0].y, params[0].width, params[0].height];
    return params[0];
  }
  constructor(
    ...params: [rect: RectObject | VectorArray<4>] | [point: PointValue, size: SizeValue] | [x: number, y: number, width: number, height: number]
  ) {
    super(...Rect.parse(...params));
  }

  /** Alias for `size[0]` */
  get x() {
    return this[0];
  }
  /** Alias for `size[1]` */
  get y() {
    return this[1];
  }
  /** Alias for `size[2]` */
  get w() {
    return this[2];
  }
  /** Alias for `size[2]` */
  get width() {
    return this[2];
  }
  /** Alias for `size[3]` */
  get h() {
    return this[3];
  }
  /** Alias for `size[3]` */
  get height() {
    return this[3];
  }

  /** Position of the rectangle */
  @cached
  get position() {
    return new Point(this);
  }

  /** Size of the rectangle */
  @cached
  get size() {
    return new Size(this);
  }
}

export type RectParams = ConstructorParameters<typeof Rect>;

export type RectValue = Extract<RectParams, { length: 1 }>[0];
