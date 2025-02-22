declare global {
  /** From T, pick a set of properties whose keys are in the union K. Same as Pick<T, K> */
  type PickHelper<T, K extends keyof T> = { [P in K]: T[P] };
  /** Construct a type with the properties of T except for those in type K. */
  type OmitHelper<T, K extends keyof T> = { [P in Exclude<keyof T, K>]: T[P] };

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
  type Extend<T, U> = Omit<T, keyof U> & U;
  /** Changes some fields to optional */
  type PartialSome<T, K extends keyof T> = Extend<T, Partial<PickHelper<T, K>>>;
  /** Changes some fields to required */
  type RequiredSome<T, K extends keyof T> = Extend<T, Required<PickHelper<T, K>>>;

  /** If X equals to Y returns A, otherwise returns B */
  type IfEquals<X, Y, A = X, B = never> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? A : B;

  /** Return union of T writable keys */
  type WritableKeys<T> = {
    [P in keyof T]-?: IfEquals<{ [Q in P]: T[Q] }, { -readonly [Q in P]: T[Q] }, P>;
  }[keyof T];
  /** Return union of T readonly keys */
  type ReadonlyKeys<T> = {
    [P in keyof T]-?: IfEquals<{ [Q in P]: T[Q] }, { -readonly [Q in P]: T[Q] }, never, P>;
  }[keyof T];
  /** Return union of T methods keys */
  type MethodsKeys<T> = {
    [P in keyof T]: T[P] extends Method<T, never, unknown> ? P : never;
  }[keyof T];

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

  type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (k: infer I extends U) => void ? I : never;
}
