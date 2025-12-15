import { cached } from "@anion155/shared/decorators";
import { hasTypedField } from "@anion155/shared/is";

import type { NumberVector, NumberVectorParams } from "./vector";
import { createNumberVector, VectorIteratingInvalid } from "./vector";

export type Point2DObject = { readonly x: number; readonly y: number };
type _Point2DValue = Point2DObject | number;
export type Point2DValue = NumberVectorParams<2, _Point2DValue>;

export interface Point2D extends NumberVector<2> {}
/** Point class. */
export class Point2D
  extends createNumberVector(2, {
    name: "Point2D",
    parseTuple: (value: _Point2DValue) => {
      if (typeof value === "number") return [value, value];
      if (hasTypedField(value, "x", "number") && hasTypedField(value, "y", "number")) return [value.x, value.y];
      throw new VectorIteratingInvalid("Unsupported Point2D param");
    },
  })
  implements Point2DObject
{
  constructor(...params: [point: Point2DValue] | [x: number, y: number]) {
    super(...params);
  }

  /** Alias for `point[0]` */
  @cached
  get x() {
    return this[0];
  }
  /** Alias for `point[1]` */
  @cached
  get y() {
    return this[1];
  }

  /** Vector's length from [0, 0] */
  @cached
  get magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /** Distance between {@link this} vector and {@link other} */
  distance(other: NumberVectorParams<2, Point2DValue>) {
    return this.sub(other).magnitude;
  }

  /** Normalize vector */
  @cached
  normalize() {
    return this.div(this.magnitude);
  }

  /** Scalar multiplication of {@link this} and {@link other} */
  dot(other: NumberVectorParams<2, Point2DValue>) {
    const { x, y } = this.mul(other);
    return x + y;
  }

  /** Angle between two vectors {@link this} and {@link other} in radians */
  andgle(other: NumberVectorParams<2, Point2DValue>) {
    const _other = Point2D.parseValue(other);
    return Math.acos(this.dot(_other) / this.magnitude / _other.magnitude);
  }
}
export type Point2DParams = ConstructorParameters<typeof Point2D>;
