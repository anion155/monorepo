import "@anion155/shared/global";

import { doRun } from "@anion155/shared/do";
import { createErrorClass } from "@anion155/shared/errors";
import type { Curried } from "@anion155/shared/functional";
import { curryHelper, identity } from "@anion155/shared/functional";
import { hasTypedField, is } from "@anion155/shared/is";
import { appendProperty, defineProperty } from "@anion155/shared/object";

/** Readonly tuple */
export type Tuple<N extends number, T, R extends readonly T[] = readonly []> = number extends N
  ? readonly T[]
  : N extends R["length"]
    ? R extends readonly unknown[]
      ? R
      : never
    : Tuple<N, T, readonly [...R, T]>;

/** Readonly tuple of numbers */
export type NumberTuple<N extends number> = Tuple<N, number>;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type _NumberVectorComponents<N extends number, C extends readonly 0[] = readonly [], R = {}> = number extends N
  ? R & { readonly [index: number]: number }
  : N extends C["length"]
    ? R
    : _NumberVectorComponents<N, readonly [...C, 0], R & { readonly [Index in C["length"]]: number }>;
export type NumberVector<N extends number> = Omit<_NumberVectorComponents<N>, never>;

type RangeTuple<From extends number, To extends number, FromC extends 0[] = [], ToC extends number[] = []> = number extends From
  ? number[]
  : number extends To
    ? number[]
    : From extends FromC["length"]
      ? To extends [...FromC, ...ToC]["length"]
        ? ToC
        : RangeTuple<From, To, FromC, [...ToC, [...FromC, ...ToC]["length"]]>
      : RangeTuple<From, To, [...FromC, 0], []>;

export type NumberVectorParams<N extends number, Value = never> = NumberVector<N> | NumberTuple<N> | Value;

/** Readonly tuple of numbers, can be used as base for types like Point. */
export const createNumberVector = <N extends number, Value = never>(
  length: N,
  { name = `NumberVector(${length})`, parseTuple = identity as never }: { name?: string; parseTuple?: (value: Value) => NumberTuple<N> } = {},
) => {
  if (length < 2) throw new VectorInvalid("Invalid number vector length, must be more then 1");
  if (!Number.isInteger(length)) throw new VectorInvalid("Invalid number vector length, must be integer");

  interface INumberVectorBase {
    readonly length: N;
  }
  const NumberVectorBase = doRun(
    (): {
      new (...values: NumberTuple<N>): INumberVectorBase;
      prototype: INumberVectorBase;
      name: string;
    } => {
      const prototype = {};
      appendProperty(prototype, "length", { value: length, writable: false, enumerable: false, configurable: true });
      function NumberVector(this: never, ...values: number[]) {
        for (let index = 0; index < length; index += 1) {
          Object.defineProperty(this, index, { value: values[index], writable: false, enumerable: true, configurable: true });
        }
      }
      NumberVector.prototype = prototype;
      return NumberVector as never;
    },
  );

  type BaseVectorParam = SpecificNumberVector | NumberVectorParams<N, Value>;
  type BaseVectorConstructor = { new (...params: NumberTuple<N>): SpecificNumberVector & NumberVector<N> };
  type VectorParam<VC extends BaseVectorConstructor> = InstanceType<VC> | NumberVectorParams<N, Value>;

  function isNumberVector(vector: unknown): vector is NumberVector<N> | NumberTuple<N> {
    if (!is(vector, "object")) return false;
    if (!hasTypedField(vector, "length", "number")) return false;
    if (vector.length !== length) return false;
    for (let index = 0; index < length; index += 1) {
      if (!hasTypedField(vector, index, "number")) return false;
    }
    return true;
  }
  function* iterator(vector: BaseVectorParam) {
    if (!(vector instanceof SpecificNumberVector) && !isNumberVector(vector)) vector = parseTuple(vector);
    for (let index = 0; index < length; index += 1) {
      if (!hasTypedField(vector, index, "number")) throw new VectorIteratingInvalid("Trying to iterate over invalid number vector");
      // @ts-expect-error - it does have indexed fields
      yield vector[index] as number;
    }
  }
  function* iterators<Vectors extends BaseVectorParam[]>(...vectors: Vectors): Generator<NumberTuple<Vectors["length"]>, void, unknown> {
    const iterators = vectors.map((vector) => iterator(vector));
    let results = iterators.map((iterator) => iterator.next());
    while (true) {
      if (results.find((result) => result.done)) return;
      yield results.map((result) => result.value!) as never;
      results = iterators.map((iterator) => iterator.next());
    }
  }
  const project =
    <Instance extends SpecificNumberVector>(constr: { new (...params: NumberTuple<N>): Instance }) =>
    <Vectors extends BaseVectorParam[]>(...vectors: Vectors) => {
      return curryHelper((project: (...params: [...NumberTuple<Vectors["length"]>, index: number]) => number): Instance => {
        // @ts-expect-error - suppose to have this kind of constructor
        return new constr(...iterators(...vectors).map((scalars, index) => project(...scalars, index)));
      });
    };
  const projectInstance = <Instance extends SpecificNumberVector, Others extends BaseVectorParam[]>(
    ...vectors: [instance: Instance, ...others: Others]
  ) => {
    const constr = vectors[0].constructor as { new (...params: NumberTuple<N>): Instance };
    return project(constr)(...vectors);
  };

  interface SpecificNumberVector {
    readonly [Symbol.toStringTag]: string;
  }
  class SpecificNumberVector extends NumberVectorBase {
    /** Detect is value. */
    static isValue<VC extends BaseVectorConstructor>(this: VC, value: unknown): value is VectorParam<VC> {
      if (value instanceof this || isNumberVector(value)) return true;
      try {
        return Array.isArray(parseTuple(value as never));
      } catch {
        return false;
      }
    }
    /** Parses value into vector instance. */
    static parseValue = Object.assign(
      function parseValue<VC extends BaseVectorConstructor>(this: VC, value: VectorParam<VC>): InstanceType<VC> {
        if (value instanceof this) return value as never;
        if (isNumberVector(value)) return new this(...(iterator(value) as never)) as never;
        return new this(...parseTuple(value)) as never;
      },
      {
        bound<VC extends BaseVectorConstructor>(constr: VC) {
          return (value: VectorParam<VC>): InstanceType<VC> => SpecificNumberVector.parseValue.call(constr, value) as never;
        },
      },
    );
    /** Iterates over passed {@link vectors} scalars. */
    static iterators<VC extends BaseVectorConstructor, Vectors extends VectorParam<VC>[]>(
      this: VC,
      ...vectors: Vectors
    ): Generator<NumberTuple<Vectors["length"]>, void, unknown> {
      return iterators(...vectors);
    }
    /** Projects passed {@link vectors} to new vector instance with {@link project} function */
    static project<VC extends BaseVectorConstructor, Vectors extends VectorParam<VC>[]>(
      this: VC,
      ...vectors: Vectors
    ): Curried<(project: (...params: [...NumberTuple<Vectors["length"]>, index: number]) => number) => InstanceType<VC>> {
      return project(this)(...vectors) as never;
    }

    constructor(...params: [vector: NumberVectorParams<N, Value>] | NumberTuple<N>) {
      if (params.length === 1) super(...(iterator(params[0] as NumberVectorParams<N, Value>) as never));
      else super(...(params as NumberTuple<N>));
    }

    /** Return string representation of {@link this} vector */
    toString() {
      return `${this[Symbol.toStringTag]} [${Array.prototype.join.call(this, ", ")}]`;
    }
    /** Return JSON representation of {@link this} vector */
    toJSON() {
      return [this.constructor.name, this.toArray()];
    }

    /**
     * Converts type to tuple type but without any methods of array available
     *
     * @example
     * ctx.draw(...position.asTuple());
     */
    asTuple(): NumberTuple<N> {
      return this as never;
    }

    /**
     * Converts to array, mainly for times when it has to be spread as function parameters,
     * cause Generators can't be typesafe in this case
     */
    toArray(): NumberTuple<N> {
      return Array.from(this as never) as never;
    }

    /** Get {@link index} scalars. */
    at(index: RangeTuple<0, N>[number]): number;
    at(index: number): undefined;
    at(index: number) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      return (this as any)[index];
    }
    /** Iterate over {@link this}'s vector scalars. */
    [Symbol.iterator]() {
      return iterator(this);
    }

    /** Creates new Vector by adding {@link other}'s scalars to {@link this}'s scalars. */
    equals(other: NumberVectorParams<N, Value | this>): boolean {
      for (const [thisScalar, otherScalar] of iterators(this, other)) {
        if (thisScalar !== otherScalar) return false;
      }
      return true;
    }

    /** Creates new Vector by adding {@link other}'s scalars to {@link this}'s scalars. */
    add(other: NumberVectorParams<N, Value | this>) {
      return projectInstance(this, other)((t, o) => t + o);
    }
    /** Creates new Vector by subtracting {@link other}'s scalars from {@link this}'s scalars. */
    sub(other: NumberVectorParams<N, Value | this>) {
      return projectInstance(this, other)((t, o) => t - o);
    }
    /** Creates new Vector by multiplying {@link other}'s scalars to {@link this}'s scalars. */
    mul(other: NumberVectorParams<N, Value | this>) {
      return projectInstance(this, other)((t, o) => t * o);
    }
    /** Creates new Vector by dividing {@link this}'s scalars by {@link other}'s scalars. */
    div(other: NumberVectorParams<N, Value | this>) {
      return projectInstance(this, other)((t, o) => t / o);
    }
    /** Creates new Vector with remainders of dividing {@link this}'s scalars by {@link other}'s scalars. */
    mod(other: NumberVectorParams<N, Value | this>) {
      return projectInstance(this, other)((t, o) => t % o);
    }
  }
  defineProperty(SpecificNumberVector, "name", { value: name, writable: true, enumerable: false, configurable: true });
  defineProperty(SpecificNumberVector.prototype, Symbol.toStringTag, { value: name, writable: false, enumerable: false, configurable: true });
  return SpecificNumberVector;
};

export class VectorInvalid extends createErrorClass("VectorInvalid") {}
export class VectorIteratingInvalid extends createErrorClass("VectorIteratingInvalid") {}

export const boundParseValue = <VC extends { new (...params: never): unknown; parseValue(value: never): unknown }>(constr: VC) => {
  return (value: Parameters<VC["parseValue"]>[0]): InstanceType<VC> => constr.parseValue(value) as never;
};
