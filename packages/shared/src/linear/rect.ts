import { cached } from "../decorators";
import type { InferVectorValue, VectorArray } from "../vector";
import { parseVectorValue, Vector } from "../vector";
import type { PointObject, PointValue } from "./point";
import { Point } from "./point";
import type { SizeObject, SizeShortObject, SizeValue } from "./size";
import { Size } from "./size";

export type RectObject = PointObject & SizeObject;

/** Rect class. */
export class Rect extends Vector(4, "Rect") implements PointObject, SizeObject, SizeShortObject {
  /** Parses {@link RectParams} into tuple of 4 numbers */
  static parseParams(...params: RectParams): VectorArray<4> {
    if (params.length === 4) return params;
    if (params.length === 2) return [...Point.parseParams(params[0]), ...Size.parseParams(params[1])];
    if ("x" in params[0]) return [params[0].x, params[0].y, params[0].width, params[0].height];
    return params[0];
  }
  static parseValue(value: RectValue): Rect {
    return parseVectorValue(4, this, value);
  }
  constructor(
    ...params: [rect: RectObject | VectorArray<4>] | [point: PointValue, size: SizeValue] | [x: number, y: number, width: number, height: number]
  ) {
    super(...Rect.parseParams(...params));
  }

  /** Alias for `size[0]` */
  @cached
  get x() {
    return this[0];
  }
  /** Alias for `size[1]` */
  @cached
  get y() {
    return this[1];
  }

  /** Alias for `size[2]` */
  @cached
  get w() {
    return this[2];
  }
  /** Alias for `size[2]` */
  @cached
  get width() {
    return this[2];
  }
  /** Alias for `size[3]` */
  @cached
  get h() {
    return this[3];
  }
  /** Alias for `size[3]` */
  @cached
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

  /** Expands this rect with {@link other} rect. */
  expandBy(other: RectValue) {
    const _other = Rect.parseValue(other);
    const x = Math.min(this.x, _other.x);
    const y = Math.min(this.y, _other.y);
    const w = Math.max(this.x + this.w, _other.x + _other.w) - x;
    const h = Math.max(this.y + this.h, _other.y + _other.h) - y;
    return new Rect(x, y, w, h);
  }
}
export type RectParams = ConstructorParameters<typeof Rect>;
export type RectValue = InferVectorValue<4, typeof Rect>;
