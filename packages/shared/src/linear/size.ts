import { cached } from "../decorators";
import { hasTypedField } from "../is";
import type { NumberVectorComponents, NumberVectorParams } from "./vector";
import { createNumberVector, VectorIteratingInvalid } from "./vector";

export type SizeObject = { readonly width: number; readonly height: number };
export type SizeShortObject = { readonly w: number; readonly h: number };
type _SizeValue = SizeObject | SizeShortObject | number;
export type SizeValue = NumberVectorParams<2, _SizeValue>;

export interface Size extends NumberVectorComponents<2> {}
/** Size class. */
export class Size
  extends createNumberVector(2, {
    name: "Size",
    parseTuple: (value: _SizeValue) => {
      if (typeof value === "number") return [value, value];
      if (hasTypedField(value, "width", "number") && hasTypedField(value, "height", "number")) return [value.width, value.height];
      if (hasTypedField(value, "w", "number") && hasTypedField(value, "h", "number")) return [value.w, value.h];
      throw new VectorIteratingInvalid("Unsupported Size param");
    },
  })
  implements SizeObject, SizeShortObject
{
  constructor(...params: [size: SizeValue] | [width: number, height: number]) {
    super(...params);
  }

  /** Alias for `size[0]` */
  @cached
  get w() {
    return this[0];
  }
  /** Alias for `size[0]` */
  @cached
  get width() {
    return this[0];
  }
  /** Alias for `size[1]` */
  @cached
  get h() {
    return this[1];
  }
  /** Alias for `size[1]` */
  @cached
  get height() {
    return this[1];
  }
}
export type SizeParams = ConstructorParameters<typeof Size>;
