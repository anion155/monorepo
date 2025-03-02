import { Equal, Expect, ExpectNot } from "../type-tests";

type PickHelperCases = [
  // should autosuggest key names
  Expect<Equal<PickHelper<{ a: number; b: string }, "a">, { a: number }>>,
  // @ts-expect-error(2344): should assert unknown keys
  PickHelper<{ a: number; b: string }, "c">
];

type OmitHelperCases = [
  // should autosuggest key names
  Expect<Equal<OmitHelper<{ a: number; b: string }, "a">, { b: string }>>,
  // @ts-expect-error(2344): should assert unknown keys
  OmitHelper<{ a: number; b: string }, "c">
];

type MutableCases = [
  // should delete readonly in top object
  Expect<Equal<Mutable<{ readonly a: number; readonly b: { readonly c: string } }>, { a: number; b: { readonly c: string } }>>
];

type DeepReadonlyCases = [
  // should make readonly all props no matter how deep
  Expect<
    Equal<
      DeepReadonly<{ a: number; b: { c: string; d: object[] } }>,
      { readonly a: number; readonly b: { readonly c: string; readonly d: readonly object[] } }
    >
  >,
  // should change only top 2 layers of object
  Expect<
    Equal<
      DeepReadonly<{ a: number; b: { c: string; d: object[] } }, 2>,
      { readonly a: number; readonly b: { readonly c: string; readonly d: object[] } }
    >
  >
];

type DeepMutableCases = [
  // should make mutable all props no matter how deep
  Expect<
    Equal<
      DeepMutable<{ readonly a: number; readonly b: { readonly c: string; readonly d: readonly object[] } }>,
      { a: number; b: { c: string; d: object[] } }
    >
  >,
  // should change only top 2 layers of object
  Expect<
    Equal<
      DeepMutable<{ readonly a: number; readonly b: { readonly c: string; readonly d: readonly object[] } }, 2>,
      { a: number; b: { c: string; d: readonly object[] } }
    >
  >
];

type ExtendCases = [
  // should make mutable all props no matter how deep
  Expect<Equal<Extend<{ a: number; b: string }, { b: "test"; c: object }>, { a: number } & { b: "test"; c: object }>>
];

type PartialSomeCases = [
  // should change 'b' to optional
  Expect<Equal<PartialSome<{ a: number; b: string }, "b">, { a: number } & { b?: string }>>
];

type RequiredSomeCases = [
  // should change 'b' to required
  Expect<Equal<RequiredSome<{ a?: number; b?: string }, "b">, { a?: number } & { b: string }>>
];

type IfEqualsCases = [
  // should compare types
  ExpectNot<IfEquals<"a", "b", true, false>>,
  Expect<IfEquals<"a", "a", true, false>>,
  Expect<IfEquals<never, never, true, false>>,
  ExpectNot<IfEquals<"a", never, true, false>>,
  ExpectNot<IfEquals<never, "a", true, false>>
];

type WritableKeysCases = [
  // should return only writable keys
  Expect<Equal<WritableKeys<{ a: number; readonly b: string }>, "a">>
];

type ReadonlyKeysCases = [
  // should return only readonly keys
  Expect<Equal<ReadonlyKeys<{ a: number; readonly b: string }>, "b">>
];

type MethodsKeysCases = [
  // should return only readonly keys
  Expect<Equal<MethodsKeys<{ a: number; b(): number }>, "b">>
];

type TupleUnshiftCases = [
  // should create tuple
  Expect<Equal<TupleUnshift<[1, 2, 3]>, [1, [2, 3]]>>,
  Expect<Equal<TupleUnshift<[]>, [undefined, []]>>,
  Expect<Equal<TupleUnshift<number[]>, [number, number[]]>>,
  Expect<Equal<TupleUnshift<[1, ...number[]]>, [1, number[]]>>
];

type TuplePopCases = [
  // should create tuple
  Expect<Equal<TuplePop<[1, 2, 3]>, [[1, 2], 3]>>,
  Expect<Equal<TuplePop<[]>, [[], undefined]>>,
  Expect<Equal<TuplePop<number[]>, [number[], number]>>,
  Expect<Equal<TuplePop<[1, ...number[]]>, [[1, ...number[]], number]>>
];
