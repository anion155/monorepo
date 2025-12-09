import { cached } from "../decorators";
import { hasTypedField } from "../is";
import type { NumberVectorComponents, NumberVectorParams } from "./vector";
import { createNumberVector, VectorIteratingInvalid } from "./vector";

export type Point2DObject = { readonly x: number; readonly y: number };
export type Point2DValue = Point2DObject | number;

export interface Point2D extends NumberVectorComponents<2> {}
/** Point class. */
export class Point2D
  extends createNumberVector(2, {
    name: "Point2D",
    parseTuple: (value: Point2DValue) => {
      if (typeof value === "number") return [value, value];
      if (hasTypedField(value, "x", "number") && hasTypedField(value, "y", "number")) return [value.x, value.y];
      throw new VectorIteratingInvalid("Unsupported Point2D param");
    },
  })
  implements Point2DObject
{
  constructor(...params: [point: NumberVectorParams<2, Point2DValue>] | [x: number, y: number]) {
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
}
export type Point2DParams = ConstructorParameters<typeof Point2D>;
