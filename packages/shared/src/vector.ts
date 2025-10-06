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
