import "@anion155/shared/global";

import { defineProperty, doThrow } from "@anion155/shared";
import { cached } from "@anion155/shared/decorators";

import type { NumberTuple, NumberVectorParams, NumberVectorScalars } from "./vector";
import { createNumberVector, VectorValueInvalid } from "./vector";

/** Abstract Point class. */
export const createPoint = <N extends number, Value = never>(
  length: N,
  {
    name = `Point(${length})`,
    parseTuple = () => doThrow(new VectorValueInvalid("Unsupported value")),
  }: { name?: string; parseTuple?: (value: Value) => NumberTuple<N> } = {},
) => {
  type BaseVectorConstructor = Omit<typeof SpecificPoint, never> & {
    new (...params: NumberTuple<N>): SpecificPoint & NumberVectorScalars<N>;
  };

  const addScalars = <Instance extends SpecificPoint>(value: Instance) => {
    return value as never as Instance &
      NumberVectorScalars<N> & {
        constructor: Omit<typeof SpecificPoint, never> & { new (...params: NumberTuple<N>): Instance & NumberVectorScalars<N> };
      };
  };

  class SpecificPoint extends createNumberVector(length, {
    parseTuple: (value: number | Value) => {
      if (typeof value === "number") return Array.from({ length }, () => value) as NumberTuple<N>;
      return parseTuple(value);
    },
  }) {
    /** Scalar multiplication of {@link valueA} and {@link valueB}. */
    static dot<VC extends BaseVectorConstructor>(this: VC, valueA: PointParams<N, Value>, valueB: PointParams<N, Value>) {
      return this.mul(valueA, valueB)
        .iterate()
        .reduce((prev, curr) => prev + curr);
    }
    /** Scalar multiplication of {@link this} and {@link other}. */
    dot(other: PointParams<N, Value>) {
      return addScalars(this).constructor.dot(addScalars(this), other);
    }

    /** Vector's distance from [0, 0]. */
    static magnitude<VC extends BaseVectorConstructor>(this: VC, value: PointParams<N, Value>) {
      return Math.sqrt(this.dot(value, value));
    }
    /** Vector's distance from [0, 0] */
    @cached
    get magnitude() {
      return addScalars(this).constructor.magnitude(addScalars(this));
    }

    /** Angle between two vectors {@link valueA} and {@link valueB} in radians. */
    static andgle<VC extends BaseVectorConstructor>(this: VC, valueA: PointParams<N, Value>, valueB: PointParams<N, Value>) {
      const vectorA = this.parseValue(valueA);
      const vectorB = this.parseValue(valueB);
      return Math.acos(this.dot(vectorA, vectorB) / vectorA.magnitude / vectorB.magnitude);
    }
    /** Angle between two vectors {@link this} and {@link other} in radians */
    andgle(other: PointParams<N, Value>) {
      return addScalars(this).constructor.andgle(addScalars(this), other);
    }

    /** Distance between {@link valueA} vector and {@link valueB}. */
    static distance<VC extends BaseVectorConstructor>(this: VC, valueA: PointParams<N, Value>, valueB: PointParams<N, Value>) {
      return this.sub(valueA, valueB).magnitude;
    }
    /** Distance between {@link this} vector and {@link other} */
    distance(other: PointParams<N, Value>) {
      return addScalars(this).constructor.distance(addScalars(this), other);
    }

    /** Normalize vector. */
    static normalize<VC extends BaseVectorConstructor>(this: VC, value: PointParams<N, Value>) {
      const vector = this.parseValue(value);
      return this.div(vector, vector.magnitude);
    }
    /** Normalized vector. */
    @cached
    normalize() {
      return addScalars(this).constructor.normalize(addScalars(this));
    }
  }
  defineProperty(SpecificPoint, "name", { value: name, writable: true, enumerable: false, configurable: true });
  defineProperty(SpecificPoint.prototype, Symbol.toStringTag, { value: name, writable: false, enumerable: false, configurable: true });
  return SpecificPoint;
};

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
export type PointParams<N extends number, Value = never> = NumberVectorParams<N, Value | number>;
