import { cached } from "@anion155/shared/decorators";
import { hasTypedField } from "@anion155/shared/is";

import type { NumberVectorComponents, NumberVectorParams } from "./vector";
import { createNumberVector, VectorIteratingInvalid } from "./vector";

export type Point2DObject = { readonly x: number; readonly y: number };
type _Point2DValue = Point2DObject | number;
export type Point2DValue = NumberVectorParams<2, _Point2DValue>;

export interface Point2D extends NumberVectorComponents<2> {}
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
}
export type Point2DParams = ConstructorParameters<typeof Point2D>;
