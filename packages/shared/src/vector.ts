import { appendProperty, create } from "./object";

/** Readonly tuple of numbers */
export type VectorArray<N extends number, R extends readonly unknown[] = readonly [number]> = number extends N
  ? number[]
  : N extends R["length"]
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
  project<
    VC extends Constructor<[...VectorArray<N>], Vector<N>> & {
      parseParams(other: VectorArray<N>): VectorArray<N>;
      parseParams(...params: never): VectorArray<N>;
    },
  >(
    this: VC,
    a: Extract<Parameters<VC["parseParams"]>, { length: 1 }>[0],
    b: Extract<Parameters<VC["parseParams"]>, { length: 1 }>[0],
    project: (a: number, b: number) => number,
  ): InstanceType<VC>;
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

  function project(
    this: Constructor<[...VectorArray<N>], Vector<N>> & { parseParams(param: unknown): VectorArray<N> },
    a: unknown,
    b: unknown,
    project: (a: number, b: number) => number,
  ) {
    const _a = this.parseParams(a);
    const _b = this.parseParams(b);
    return new this(...(_a.map((av, i) => project(av, _b[i])) as never));
  }
  fabric.project = project;

  return fabric as never;
};
