declare global {
  /** Extract from T those types that are assignable to U. */
  type ExtractHelper<T, U extends T> = Extract<T, U>;
  /** Exclude from T those types that are assignable to U. */
  type ExcludeHelper<T, U extends T> = Exclude<T, U>;
  /** From T, pick a set of properties whose keys are in the union K. Same as Pick<T, K> */
  type PickHelper<T, K extends keyof T> = Pick<T, K>;
  /** Construct a type with the properties of T except for those in type K. */
  type OmitHelper<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
  /** Create intersected type. */
  type IntersectHelper<T, U> = T extends Callable<never, unknown> ? T & U : U extends Callable<never, unknown> ? T & U : Omit<T & U, never>;

  /** Make all properties in T mutable */
  type Mutable<T> = {
    -readonly [P in keyof T]: T[P];
  };

  /**
   * Recursively make all properties in T readonly
   * @template Deep - specify maximum depth to traverse
   */
  type DeepReadonly<T, Deep extends number = 0, _Current extends unknown[] = [""]> = {
    readonly [P in keyof T]: T[P] extends object ? (_Current["length"] extends Deep ? T[P] : DeepReadonly<T[P], Deep, [..._Current, ""]>) : T[P];
  };
  /**
   * Recursively make all properties in T mutable
   * @template Deep - specify maximum depth to traverse
   */
  type DeepMutable<T, Deep extends number = 0, _Current extends unknown[] = [""]> = {
    -readonly [P in keyof T]: T[P] extends object ? (_Current["length"] extends Deep ? T[P] : DeepMutable<T[P], Deep, [..._Current, ""]>) : T[P];
  };

  /** Takes U and adds not overlapping fields from T */
  type Extend<T, U> = T extends Callable<never, unknown> ? T & U : U extends Callable<never, unknown> ? T & U : Omit<Omit<T, keyof U> & U, never>;
  /** Changes some fields to optional */
  type PartialSome<T, K extends keyof T> = Extend<T, Partial<PickHelper<T, K>>>;
  /** Changes some fields to required */
  type RequiredSome<T, K extends keyof T> = Extend<T, Required<PickHelper<T, K>>>;

  /** If X equals to Y returns A, otherwise returns B */
  type IfEquals<X, Y, A = X, B = never> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? A : B;

  /** Return union of T writable keys */
  type WritableKeys<T> = Extract<{ [P in keyof T]-?: IfEquals<{ [Q in P]: T[Q] }, { -readonly [Q in P]: T[Q] }, P> }[keyof T], keyof T>;
  /** Return union of T readonly keys */
  type ReadonlyKeys<T> = Extract<{ [P in keyof T]-?: IfEquals<{ [Q in P]: T[Q] }, { -readonly [Q in P]: T[Q] }, never, P> }[keyof T], keyof T>;
  /** Return union of T methods keys */
  type MethodsKeys<T> = { [P in keyof T]: T[P] extends Method<T, never, unknown> ? P : never }[keyof T];

  /** Splits array/tuple into head and rest, and puts it in tuple */
  type TupleUnshift<T extends unknown[]> = T extends []
    ? [undefined, []]
    : T extends [infer Head, ...infer Rest extends unknown[]]
      ? [Head, Rest]
      : [T[0], T];
  /** Splits array/tuple into rest and tail, and puts it in tuple */
  type TuplePop<T extends unknown[]> = T extends []
    ? [[], undefined]
    : T extends [...infer Rest extends unknown[], infer Tail]
      ? [Rest, Tail]
      : T extends [infer Head, ...infer Rest extends unknown[]]
        ? [[Head, ...TuplePop<Rest>[0]], TuplePop<Rest>[1]]
        : [T, T[0]];

  /** Converts union type to intersection type */
  type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (k: infer I extends U) => void ? I : never;

  /** Creates union of {@link T} and {@link U} types and adds undefined optional definitions */
  type ExclusiveUnion<T extends object, U extends object> = T extends unknown
    ? U extends unknown
      ? Omit<T & { [K in Exclude<keyof U, keyof T>]?: never }, never> | Omit<U & { [K in Exclude<keyof T, keyof U>]?: never }, never>
      : never
    : never;

  /** Readonly tuple */
  type Tuple<N extends number, T, R extends readonly T[] = readonly []> = number extends N
    ? readonly T[]
    : N extends R["length"]
      ? R extends readonly unknown[]
        ? R
        : never
      : Tuple<N, T, readonly [...R, T]>;

  /** Readonly tuple of numbers */
  type RangeTuple<From extends number, To extends number, FromC extends 0[] = [], ToC extends number[] = []> = number extends From
    ? number[]
    : number extends To
      ? number[]
      : From extends FromC["length"]
        ? To extends [...FromC, ...ToC]["length"]
          ? ToC
          : RangeTuple<From, To, FromC, [...ToC, [...FromC, ...ToC]["length"]]>
        : RangeTuple<From, To, [...FromC, 0], []>;

  type Digit = RangeTuple<0, 10>[number];
  type Hex = `${Digit}` | "A" | "B" | "C" | "D" | "E" | "F" | "a" | "b" | "c" | "d" | "e" | "f";
  type Byte = RangeTuple<0, 0xff>[number];
  /** Type that detects numbers. */
  type IfNumber<T, A = true, B = false> = T extends number ? A : B;
  /** Extracts number literal from string literal. */
  type ToNumber<T> = T extends `0x${string}` | `${number}e${number}` ? never : T extends `${infer N extends number}` ? N : never;
  /** Type that detects negative numbers. */
  type IfNegativeNumber<T extends number, A = true, B = false> = `${T}` extends `-${number}` ? A : B;
  /** Type that detects integer numbers. */
  type IfIntegerNumber<T extends number, A = true, B = false> = `${T}` extends `${number}.${number}` | `${number}e-${number}` ? B : A;
  /** A type that calculates the absolute value of a numeric literal type T. */
  type AbsNumber<T extends number> = `${T}` extends `-${infer N extends number}` ? N : T;
  /** Increment T. */
  type Increment<T extends number> =
    IfIntegerNumber<T> extends true ? (IfNegativeNumber<T> extends false ? [...RangeTuple<0, T>, 0]["length"] : never) : never;
  /** Decrement T. */
  type Decrement<T extends number> =
    IfIntegerNumber<T> extends true
      ? IfNegativeNumber<T> extends false
        ? RangeTuple<0, T> extends [...infer R extends unknown[], unknown]
          ? R["length"]
          : never
        : never
      : never;
  /** Add T and U positibe number literals. */
  type AddPositiveNumbers<T extends number, U extends number> = `${T}` extends `-${number}`
    ? never
    : `${U}` extends `-${number}`
      ? never
      : [...RangeTuple<0, T>, ...RangeTuple<0, U>]["length"];
}

export {};
