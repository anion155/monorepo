import "@anion155/shared/global";

import { doRun, doThrow } from "@anion155/shared/do";
import { createErrorClass } from "@anion155/shared/errors";
import type { Curried } from "@anion155/shared/functional";
import { curryHelper } from "@anion155/shared/functional";
import { hasTypedField, is } from "@anion155/shared/is";
import { appendProperty, defineProperty } from "@anion155/shared/object";

/** Readonly tuple of numbers */
export type NumberTuple<N extends number> = Tuple<N, number>;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type _NumberVectorComponents<N extends number, C extends readonly 0[] = readonly [], R = {}> = number extends N
  ? R & { readonly [index: number]: number }
  : N extends C["length"]
    ? R
    : _NumberVectorComponents<N, readonly [...C, 0], R & { readonly [Index in C["length"]]: number }>;
/** Defines indexed number fields from [0, N). */
export type NumberVectorScalars<N extends number> = Omit<_NumberVectorComponents<N>, never>;

/**
 * Readonly tuple of numbers, can be used as base for types like Point.
 * Should be used together with declaring NumberVector<N> type.
 *
 * @example
 * interface TestPoint extends NumberVectorScalars<2> {}
 * class TestPoint extends createNumberVector(2) {}
 * const point = new TestPoint(1, 2);
 */
export const createNumberVector = <N extends number, Value = never>(
  length: N,
  {
    name = `NumberVector(${length})`,
    parseTuple = () => doThrow(new VectorValueInvalid("Unsupported value")),
  }: { name?: string; parseTuple?: (value: Value) => NumberTuple<N> } = {},
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
  type BaseVectorConstructor = Omit<typeof SpecificNumberVector, never> & {
    new (...params: NumberTuple<N>): SpecificNumberVector & NumberVectorScalars<N>;
  };
  type VectorParam<VC extends BaseVectorConstructor> = InstanceType<VC> | NumberVectorParams<N, Value>;

  function isNumberVector(vector: unknown): vector is NumberVectorScalars<N> | NumberTuple<N> {
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
    <VC extends BaseVectorConstructor>(constr: VC) =>
    <Vectors extends BaseVectorParam[]>(...vectors: Vectors) => {
      return curryHelper((project: (scalars: NumberTuple<Vectors["length"]>, index: number) => number): InstanceType<VC> => {
        // @ts-expect-error - suppose to have this kind of constructor
        return new constr(...iterators(...vectors).map(project));
      });
    };

  const addScalars = <Instance extends SpecificNumberVector>(value: Instance) => {
    return value as never as Instance &
      NumberVectorScalars<N> & {
        constructor: Omit<typeof SpecificNumberVector, never> & { new (...params: NumberTuple<N>): Instance & NumberVectorScalars<N> };
      };
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
    static parseValue<VC extends BaseVectorConstructor>(this: VC, value: VectorParam<VC>): InstanceType<VC> {
      if (value instanceof this) return value as never;
      if (isNumberVector(value)) return new this(...(iterator(value) as never)) as never;
      return new this(...parseTuple(value)) as never;
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

    /** Pretend that this vector has smaller length. */
    as<M extends RangeTuple<2, N>[number]>(length: M): NumberVector<M> {
      return Object.create(this, { length: { value: length, writable: false, enumerable: false, configurable: true } }) as never;
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
    /** Iterate over {@link this}'s vector scalars. */
    iterate() {
      return iterator(this);
    }
    /** Iterate over passed {@link vector} scalars. */
    static iterate<VC extends BaseVectorConstructor>(this: VC, vector: VectorParam<VC>): Generator<number, void, unknown> {
      return iterator(vector);
    }
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
    ): Curried<(project: (scalars: NumberTuple<Vectors["length"]>, index: number) => number) => InstanceType<VC>> {
      return project(this)(...vectors) as never;
    }

    /** Compares two vectors. */
    static equals(a: NumberVectorParams<N, Value>, b: NumberVectorParams<N, Value>) {
      for (const [thisScalar, otherScalar] of iterators(a, b)) {
        if (thisScalar !== otherScalar) return false;
      }
      return true;
    }
    /** Compares {@link this} vector to {@link other}. */
    equals(other: NumberVectorParams<N, Value>): boolean {
      return addScalars(this).constructor.equals(addScalars(this), other);
    }

    /** Creates new Vector by reducing operator over all {@link vectos} scalars. */
    static operate<VC extends BaseVectorConstructor, Vectors extends VectorParam<VC>[]>(this: VC, ...vectors: Vectors) {
      return curryHelper((operator: (previous: number, current: number) => number) => {
        return project(this)(...vectors)((scalars) => scalars.reduce(operator));
      });
    }

    /** Creates new Vector by adding scalars of passed {@link vectors}. */
    static add<VC extends BaseVectorConstructor, Vectors extends VectorParam<VC>[]>(this: VC, ...vectors: Vectors) {
      return this.operate(...vectors)((prev, curr) => prev + curr);
    }
    /** Creates new Vector by adding {@link other}'s scalars to {@link this}'s scalars. */
    add(other: NumberVectorParams<N, Value>) {
      return addScalars(this).constructor.add(addScalars(this), other);
    }

    /** Creates new Vector by subtracting scalars of passed {@link vectors}. */
    static sub<VC extends BaseVectorConstructor, Vectors extends VectorParam<VC>[]>(this: VC, ...vectors: Vectors) {
      return this.operate(...vectors)((prev, curr) => prev - curr);
    }
    /** Creates new Vector by subtracting {@link other}'s scalars to {@link this}'s scalars. */
    sub(other: NumberVectorParams<N, Value>) {
      return addScalars(this).constructor.sub(addScalars(this), other);
    }

    /** Creates new Vector by multiplying scalars of passed {@link vectors}. */
    static mul<VC extends BaseVectorConstructor, Vectors extends VectorParam<VC>[]>(this: VC, ...vectors: Vectors) {
      return this.operate(...vectors)((prev, curr) => prev * curr);
    }
    /** Creates new Vector by multiplying {@link other}'s scalars to {@link this}'s scalars. */
    mul(other: NumberVectorParams<N, Value>) {
      return addScalars(this).constructor.mul(addScalars(this), other);
    }

    /** Creates new Vector by dividing scalars of passed {@link vectors}. */
    static div<VC extends BaseVectorConstructor, Vectors extends VectorParam<VC>[]>(this: VC, ...vectors: Vectors) {
      return this.operate(...vectors)((prev, curr) => prev / curr);
    }
    /** Creates new Vector by dividing {@link this}'s scalars by {@link other}'s scalars. */
    div(other: NumberVectorParams<N, Value>) {
      return addScalars(this).constructor.div(addScalars(this), other);
    }

    /** Creates new Vector with remainders of dividing scalars of passed {@link vectors}. */
    static mod<VC extends BaseVectorConstructor, Vectors extends VectorParam<VC>[]>(this: VC, ...vectors: Vectors) {
      return this.operate(...vectors)((prev, curr) => prev % curr);
    }
    /** Creates new Vector with remainders of dividing {@link this}'s scalars by {@link other}'s scalars. */
    mod(other: NumberVectorParams<N, Value>) {
      return addScalars(this).constructor.mod(addScalars(this), other);
    }
  }
  defineProperty(SpecificNumberVector, "name", { value: name, writable: true, enumerable: false, configurable: true });
  defineProperty(SpecificNumberVector.prototype, Symbol.toStringTag, { value: name, writable: false, enumerable: false, configurable: true });
  return SpecificNumberVector;
};
export type NumberVector<N extends number, Value = never> = InstanceType<ReturnType<typeof createNumberVector<N, Value>>> & NumberVectorScalars<N>;

/**
 * Should be used everywhere where passed param will be handled with .parseValue() call.
 *
 * @example
 *  type TestPointValue = { test: number };
 *  class TestPoint extends createNumberVector(2) {
 *    method(other: NumberVectorParams<_TestPointValue>) {
 *      const _other = TestPoint.parseValue(other);
 *    }
 *  }
 */
export type NumberVectorParams<N extends number, Value = never> = NumberVectorScalars<N> | NumberTuple<N> | Value;

export class VectorValueInvalid extends createErrorClass("VectorValueInvalid") {}
export class VectorInvalid extends createErrorClass("VectorInvalid") {}
export class VectorIteratingInvalid extends createErrorClass("VectorIteratingInvalid") {}

export const boundParseValue = <VC extends { new (...params: never): unknown; parseValue(value: never): unknown }>(constr: VC) => {
  return (value: Parameters<VC["parseValue"]>[0]): InstanceType<VC> => constr.parseValue(value) as never;
};
