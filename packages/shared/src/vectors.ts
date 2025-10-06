import { cached } from "./decorators";
import { appendProperty, create } from "./object";

/** Readonly tuple of numbers */
export type VectorArray<N extends number, R extends readonly unknown[] = readonly [number]> = N extends R["length"]
  ? R
  : VectorArray<N, readonly [...R, number]>;

/** Wrapper of readonly tuple of numbers */
export type Vector<N extends number> = VectorArray<N> & {
  [Symbol.toStringTag]: string;
  toString(): string;
  readonly length: N;
};
/** Class constructor for {@link Vector} */
export type VectorConstructor<N extends number> = {
  new (...values: VectorArray<N>): Vector<N>;
  prototype: Vector<N>;
};

/** Readonly tuple of numbers, can be used as base for types like Point. */
export const Vector = <N extends number>(length: N, name: string = `Vector(${length})`): VectorConstructor<N> => {
  function toString(this: readonly number[] & { [Symbol.toStringTag]: string }) {
    return `${this[Symbol.toStringTag]} [${this.join(", ")}]`;
  }
  const prototype = create(Array.prototype, {
    [Symbol.toStringTag]: name,
    toString,
  });
  appendProperty(prototype, "length", { value: length, writable: false });
  function fabric(this: Vector<N>, ...values: number[]) {
    for (let index = 0; index < length; index += 1) {
      Object.defineProperty(this, index, { value: values[index], writable: false, enumerable: true, configurable: true });
    }
  }
  appendProperty(fabric, "name", { value: name });
  fabric.prototype = prototype;
  return fabric as never;
};

export type PointObject = { x: number; y: number };
/** Point class. */
export class Point extends Vector(2, "Point") implements PointObject {
  /** Parses {@link PointValue} into tuple of 2 numbers */
  static parse(value: PointValue) {
    return "x" in value ? ([value.x, value.y] as const) : value;
  }
  constructor(...params: [point: PointObject] | [point: VectorArray<2>] | [x: number, y: number]) {
    if (params.length === 2) super(...params);
    else super(...Point.parse(params[0]));
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

export type SizeObject = { width: number; height: number };
export type SizeShortObject = { w: number; h: number };
/** Size class. */
export class Size extends Vector(2, "Size") implements SizeObject, SizeShortObject {
  /** Parses {@link SizeValue} into tuple of 2 numbers */
  static parse(value: SizeValue) {
    return "w" in value ? ([value.w, value.h] as const) : "width" in value ? ([value.width, value.height] as const) : value;
  }
  constructor(...params: [size: SizeObject] | [size: SizeShortObject] | [size: VectorArray<2>] | [width: number, height: number]) {
    if (params.length === 2) super(...params);
    else super(...Size.parse(params[0]));
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

export type RectObject = PointObject & SizeObject;
/** Rect class. */
export class Rect extends Vector(4, "Rect") implements PointObject, SizeObject, SizeShortObject {
  /** Parses {@link RectValue} into tuple of 4 numbers */
  static parse(value: RectValue) {
    return "x" in value ? ([value.x, value.y, value.width, value.height] as const) : value;
  }
  constructor(
    ...params:
      | [rect: RectObject]
      | [rect: VectorArray<4>]
      | [point: PointValue, size: SizeValue]
      | [x: number, y: number, width: number, height: number]
  ) {
    if (params.length === 4) super(...params);
    else if (params.length === 2) super(...Point.parse(params[0]), ...Size.parse(params[1]));
    else super(...Rect.parse(params[0]));
  }

  /** Alias for `size[0]` */
  get x() {
    return this[0];
  }
  /** Alias for `size[1]` */
  get y() {
    return this[1];
  }
  /** Alias for `size[2]` */
  get w() {
    return this[2];
  }
  /** Alias for `size[2]` */
  get width() {
    return this[2];
  }
  /** Alias for `size[3]` */
  get h() {
    return this[3];
  }
  /** Alias for `size[3]` */
  get height() {
    return this[3];
  }

  /** Position of the rectangle */
  @cached
  get position() {
    return new Point(this);
  }

  /** Size of the rectangle */
  @cached
  get size() {
    return new Size(this);
  }
}
export type RectParams = ConstructorParameters<typeof Rect>;
export type RectValue = Extract<RectParams, { length: 1 }>[0];
