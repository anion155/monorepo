import { cached } from "../decorators";
import type { InferVectorValue, VectorArray } from "../vector";
import { parseVectorValue, Vector } from "../vector";

export type PointObject = { readonly x: number; readonly y: number };

/** Point class. */
export class Point extends Vector(2, "Point") implements PointObject {
  /** Parses {@link PointParams} into tuple of 2 numbers */
  static parseParams(...params: PointParams): VectorArray<2> {
    if (params.length === 2) return params;
    if (typeof params[0] === "number") return [params[0], params[0]];
    if ("x" in params[0]) return [params[0].x, params[0].y];
    return params[0];
  }
  static parseValue(value: PointValue): Point {
    return parseVectorValue(2, this, value);
  }
  constructor(...params: [point: PointObject | VectorArray<2> | number] | [x: number, y: number]) {
    super(...Point.parseParams(...params));
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

  /** Creates new Vector by adding this's scalars to {@link other}'s scalars. */
  add(other: PointValue) {
    return Point.add(this, other);
  }
  /** Creates new Vector by subtracting {@link other}'s scalars from this's scalars. */
  sub(other: PointValue) {
    return Point.sub(this, other);
  }
  /** Creates new Vector by multiplying this's scalars with {@link other}'s scalars. */
  mul(other: PointValue) {
    return Point.mul(this, other);
  }
  /** Creates new Vector by dividing this's scalars by {@link other}'s scalars. */
  div(other: PointValue) {
    return Point.div(this, other);
  }
  /** Creates new Vector with remainders of dividing this's scalars by {@link other}'s scalars. */
  mod(other: PointValue) {
    return Point.mod(this, other);
  }
}
export type PointParams = ConstructorParameters<typeof Point>;
export type PointValue = InferVectorValue<2, typeof Point>;
