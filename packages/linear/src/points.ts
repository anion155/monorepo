import { cached } from "@anion155/shared/decorators";
import { hasTypedField } from "@anion155/shared/is";

import { createPoint } from "./point";
import type { NumberVectorParams, NumberVectorScalars } from "./vector";
import { VectorIteratingInvalid } from "./vector";

export type Point2DObject = { readonly x: number; readonly y: number };
export type Point2DValue = NumberVectorParams<2, Point2DObject>;
export interface Point2D extends NumberVectorScalars<2> {}
/** Point in 2 dimensions class. */
export class Point2D
  extends createPoint(2, {
    name: "Point2D",
    parseTuple: (value: Point2DObject) => {
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

export type Point3DObject = Point2DObject & { readonly z: number };
export type Point3DValue = NumberVectorParams<3, Point3DObject>;
export interface Point3D extends NumberVectorScalars<3> {}
/** Point in 3 dimensions class. */
export class Point3D
  extends createPoint(3, {
    name: "Point3D",
    parseTuple: (value: Point3DObject) => {
      if (hasTypedField(value, "x", "number") && hasTypedField(value, "y", "number") && hasTypedField(value, "z", "number"))
        return [value.x, value.y, value.z];
      throw new VectorIteratingInvalid("Unsupported Point3D param");
    },
  })
  implements Point3DObject
{
  constructor(...params: [point: Point3DValue] | [x: number, y: number, z: number]) {
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
  /** Alias for `point[2]` */
  @cached
  get z() {
    return this[2];
  }
}
export type Point3DParams = ConstructorParameters<typeof Point3D>;
