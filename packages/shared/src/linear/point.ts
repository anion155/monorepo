import type { VectorArray } from "../vector";
import { Vector } from "../vector";

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
    if (value instanceof Point) return value;
    return new Point(...this.parseParams(value));
  }
  constructor(...params: [point: PointObject | VectorArray<2> | number] | [x: number, y: number]) {
    super(...Point.parseParams(...params));
  }

  /** Alias for `point[0]` */
  get x() {
    return this[0];
  }
  /** Alias for `point[1]` */
  get y() {
    return this[1];
  }

  /** Creates new Point by adding this's scalars to {@link other} vector's scalars. */
  add(other: PointValue | number) {
    return Point.project(this, other, (a, b) => a + b);
  }
  /** Creates new Point by subtracting {@link other} vector's scalars from this's scalars. */
  sub(other: PointValue | number) {
    return Point.project(this, other, (a, b) => a - b);
  }
  /** Creates new Point by multiplying this's scalars to {@link other} vector's scalars. */
  mul(other: PointValue | number) {
    return Point.project(this, other, (a, b) => a * b);
  }
  /** Creates new Point by dividing this's scalars by {@link other} vector's scalars. */
  div(other: PointValue | number) {
    return Point.project(this, other, (a, b) => a / b);
  }
}

export type PointParams = ConstructorParameters<typeof Point>;

export type PointValue = Point | Extract<PointParams, { length: 1 }>[0];
