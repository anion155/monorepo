import { cached } from "../decorators";
import { is } from "../is";
import { updateProperties } from "../object";
import type { Point2DObject, Point2DValue } from "./point-2d";
import { Point2D } from "./point-2d";
import type { SizeObject, SizeShortObject, SizeValue } from "./size";
import { Size } from "./size";
import type { NumberVectorComponents, NumberVectorParams } from "./vector";
import { createNumberVector, VectorIteratingInvalid } from "./vector";

export type RectObject = Point2DObject & SizeObject;
type _RectValue = RectObject | (Point2DObject & SizeShortObject) | [point: Point2DValue, size: SizeValue];
export type RectValue = NumberVectorParams<4, _RectValue>;

export interface Rect extends NumberVectorComponents<4> {}
/** Rect class. */
export class Rect
  extends createNumberVector(4, {
    name: "Rect",
    parseTuple: (value: _RectValue) => {
      if (Array.isArray(value)) {
        const position = Point2D.parseValue(value[0]);
        const size = Size.parseValue(value[1]);
        return [position.x, position.y, size.w, size.h];
      }
      if (is(value, "object")) {
        const position = Point2D.parseValue(value);
        const size = Size.parseValue(value);
        return [position.x, position.y, size.w, size.h];
      }
      throw new VectorIteratingInvalid("Unsupported Rect param");
    },
  })
  implements Point2DObject, SizeObject, SizeShortObject
{
  constructor(...params: [rect: RectValue] | [point: Point2DValue, size: SizeValue] | [x: number, y: number, width: number, height: number]) {
    if (params.length === 2) {
      const position = Point2D.parseValue(params[0]);
      const size = Size.parseValue(params[1]);
      params = [[position, size]];
    }
    super(...params);
  }

  /** Alias for `rect[0]` */
  @cached
  get x() {
    return this[0];
  }
  /** Alias for `rect[1]` */
  @cached
  get y() {
    return this[1];
  }

  /** Alias for `rect[2]` */
  @cached
  get w() {
    return this[2];
  }
  /** Alias for `rect[2]` */
  @cached
  get width() {
    return this[2];
  }
  /** Alias for `rect[3]` */
  @cached
  get h() {
    return this[3];
  }
  /** Alias for `rect[3]` */
  @cached
  get height() {
    return this[3];
  }

  /** Alias for `rect[0] + rect[1]` */
  @cached
  get x2() {
    return this[0] + this[2];
  }
  /** Alias for `rect[1] + rect[3]` */
  @cached
  get y2() {
    return this[1] + this[3];
  }

  /** Position of the rectangle */
  @cached
  get position() {
    return new Point2D(this.x, this.y);
  }

  /** Size of the rectangle */
  @cached
  get size() {
    return new Size(this.w, this.h);
  }

  /** Expands this rect with {@link other} rect. */
  expandBy(other: NumberVectorParams<4, RectValue>) {
    const _other = Rect.parseValue(other);
    const x = Math.min(this.x, _other.x);
    const y = Math.min(this.y, _other.y);
    const w = Math.max(this.x + this.w, _other.x + _other.w) - x;
    const h = Math.max(this.y + this.h, _other.y + _other.h) - y;
    return new Rect(x, y, w, h);
  }

  /** Expands this rect with {@link other} rect. */
  collide(other: NumberVectorParams<4, RectValue>) {
    const _other = Rect.parseValue(other);
    const x = Math.max(this.x, _other.x);
    const y = Math.max(this.y, _other.y);
    const w = Math.min(this.x2, _other.x2) - x;
    const h = Math.min(this.y2, _other.y2) - y;
    if (w <= 0 || h <= 0) return null;
    return new Rect(x, y, w, h);
  }
}
updateProperties(Rect.prototype, { position: { enumerable: false }, size: { enumerable: false } });
export type RectParams = ConstructorParameters<typeof Rect>;
