import type { VectorArray } from "../vector";
import { Vector } from "../vector";

export type PointObject = { readonly x: number; readonly y: number };

/** Point class. */
export class Point extends Vector(2, "Point") implements PointObject {
  /** Parses {@link PointParams} into tuple of 2 numbers */
  static parse(...params: PointParams): VectorArray<2> {
    if (params.length === 2) return params;
    if ("x" in params[0]) return [params[0].x, params[0].y];
    return params[0];
  }
  constructor(...params: [point: PointObject | VectorArray<2>] | [x: number, y: number]) {
    super(...Point.parse(...params));
  }

  /** Alias for `point[0]` */
  get x() {
    return this[0];
  }
  /** Alias for `point[1]` */
  get y() {
    return this[1];
  }
}

export type PointParams = ConstructorParameters<typeof Point>;

export type PointValue = Extract<PointParams, { length: 1 }>[0];
