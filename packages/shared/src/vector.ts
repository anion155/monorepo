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
  /** Intended to be used for spreading */
  readonly _: VectorArray<N>;
};

type VectorArrayConstructor<N extends number> = Constructor<[...VectorArray<N>], Vector<N>> & {
  parseParams(other: VectorArray<N>): VectorArray<N>;
  parseParams(...params: never): VectorArray<N>;
};
/** Class constructor for {@link Vector} */
export type VectorConstructor<N extends number> = {
  new (...values: VectorArray<N>): Vector<N>;
  prototype: Vector<N>;

  /** Projects vectors's scalars with {@link project}. */
  projectScalars<VC extends VectorArrayConstructor<N>, Vectors extends Extract<Parameters<VC["parseParams"]>, { length: 1 }>[0][]>(
    this: VC,
    ...params: [...points: Vectors, project: NoInfer<(...params: [...values: VectorArray<Vectors["length"]>, index: number]) => number>]
  ): VectorArray<N>;

  /** Creates new Vector by projecting vectors's scalars with {@link project}. */
  project<VC extends VectorArrayConstructor<N>, Vectors extends Extract<Parameters<VC["parseParams"]>, { length: 1 }>[0][]>(
    this: VC,
    ...params: [...points: Vectors, project: NoInfer<(...params: [...values: VectorArray<Vectors["length"]>, index: number]) => number>]
  ): InstanceType<VC>;

  /** Creates new Vector by adding {@link a}'s scalars to {@link b}'s scalars. */
  add<VC extends VectorArrayConstructor<N>>(
    this: VC,
    a: Extract<Parameters<VC["parseParams"]>, { length: 1 }>[0],
    b: Extract<Parameters<VC["parseParams"]>, { length: 1 }>[0],
  ): InstanceType<VC>;
  /** Creates new Vector by subtracting {@link b}'s scalars from {@link a}'s scalars. */
  sub<VC extends VectorArrayConstructor<N>>(
    this: VC,
    a: Extract<Parameters<VC["parseParams"]>, { length: 1 }>[0],
    b: Extract<Parameters<VC["parseParams"]>, { length: 1 }>[0],
  ): InstanceType<VC>;
  /** Creates new Vector by multiplying {@link a}'s scalars with {@link b}'s scalars. */
  mul<VC extends VectorArrayConstructor<N>>(
    this: VC,
    a: Extract<Parameters<VC["parseParams"]>, { length: 1 }>[0],
    b: Extract<Parameters<VC["parseParams"]>, { length: 1 }>[0],
  ): InstanceType<VC>;
  /** Creates new Vector by dividing {@link a}'s scalars by {@link b}'s scalars. */
  div<VC extends VectorArrayConstructor<N>>(
    this: VC,
    a: Extract<Parameters<VC["parseParams"]>, { length: 1 }>[0],
    b: Extract<Parameters<VC["parseParams"]>, { length: 1 }>[0],
  ): InstanceType<VC>;
  /** Creates new Vector with remainders of dividing {@link a}'s scalars by {@link b}'s scalars. */
  mod<VC extends VectorArrayConstructor<N>>(
    this: VC,
    a: Extract<Parameters<VC["parseParams"]>, { length: 1 }>[0],
    b: Extract<Parameters<VC["parseParams"]>, { length: 1 }>[0],
  ): InstanceType<VC>;
};

/** Readonly tuple of numbers, can be used as base for types like Point. */
export const Vector = <N extends number>(length: N, name: string = `Vector(${length})`): VectorConstructor<N> => {
  const prototype = create(Array.prototype, {
    [Symbol.toStringTag]: name,
    toString(this: readonly number[] & { [Symbol.toStringTag]: string }) {
      return `${this[Symbol.toStringTag]} [${this.join(", ")}]`;
    },
  });
  appendProperty(prototype, "length", { value: length, writable: false });
  appendProperty(prototype, "_", {
    get(this: VectorArray<N>) {
      return this;
    },
  });

  function fabric(this: Vector<N>, ...values: number[]) {
    for (let index = 0; index < length; index += 1) {
      Object.defineProperty(this, index, { value: values[index], writable: false, enumerable: true, configurable: true });
    }
  }
  appendProperty(fabric, "name", { value: name });

  fabric.prototype = prototype;

  function projectScalars(this: VectorArrayConstructor<N>, ...params: [...vectors: unknown[], project: (value: number) => number]) {
    const project = params.pop() as (value: number) => number;
    const vectors = params.map((vector) => this.parseParams(vector as never));
    return Array.from({ length }, (_, index) => {
      // @ts-expect-error - complicated type
      return project(...vectors.map((vector) => vector[index]), index);
    }) as never;
  }
  fabric.projectScalars = projectScalars;

  function project(this: VectorArrayConstructor<N>, ...params: [...vectors: unknown[], project: (value: number) => number]) {
    return new this(...projectScalars.call(this, ...params));
  }
  fabric.project = project;

  /* eslint-disable @typescript-eslint/no-unsafe-return */
  fabric.add = function add(this: VectorArrayConstructor<N>, a: unknown, b: unknown) {
    // @ts-expect-error - complicated type
    return project.call(this, a, b, (a, b) => a + b);
  };
  fabric.sub = function sub(this: VectorArrayConstructor<N>, a: unknown, b: unknown) {
    // @ts-expect-error - complicated type
    return project.call(this, a, b, (a, b) => a - b);
  };
  fabric.mul = function mul(this: VectorArrayConstructor<N>, a: unknown, b: unknown) {
    // @ts-expect-error - complicated type
    return project.call(this, a, b, (a, b) => a * b);
  };
  fabric.div = function div(this: VectorArrayConstructor<N>, a: unknown, b: unknown) {
    // @ts-expect-error - complicated type
    return project.call(this, a, b, (a, b) => a / b);
  };
  fabric.mod = function mod(this: VectorArrayConstructor<N>, a: unknown, b: unknown) {
    // @ts-expect-error - complicated type
    return project.call(this, a, b, (a, b) => a % b);
  };
  /* eslint-enable @typescript-eslint/no-unsafe-return */

  return fabric as never;
};
