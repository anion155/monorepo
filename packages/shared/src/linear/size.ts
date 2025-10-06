import type { VectorArray } from "../vector";
import { Vector } from "../vector";

export type SizeObject = { readonly width: number; readonly height: number };
export type SizeShortObject = { readonly w: number; readonly h: number };

/** Size class. */
export class Size extends Vector(2, "Size") implements SizeObject, SizeShortObject {
  /** Parses {@link SizeParams} into tuple of 2 numbers */
  static parse(...params: SizeParams): VectorArray<2> {
    if (params.length === 2) return params;
    if ("w" in params[0]) return [params[0].w, params[0].h];
    if ("width" in params[0]) return [params[0].width, params[0].height];
    return params[0];
  }
  constructor(...params: [size: SizeObject | SizeShortObject | VectorArray<2>] | [width: number, height: number]) {
    super(...Size.parse(...params));
  }

  /** Alias for `size[0]` */
  get w() {
    return this[0];
  }
  /** Alias for `size[0]` */
  get width() {
    return this[0];
  }
  /** Alias for `size[1]` */
  get h() {
    return this[1];
  }
  /** Alias for `size[1]` */
  get height() {
    return this[1];
  }
}

export type SizeParams = ConstructorParameters<typeof Size>;

export type SizeValue = Extract<SizeParams, { length: 1 }>[0];
