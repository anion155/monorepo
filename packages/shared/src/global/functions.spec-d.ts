import "./functions";

import type { Equal, Expect } from "../type-tests";
import { expectType } from "../type-tests";

// should handle functor
{
  const functor = (a: number, b: string) => ({ c: `${a}-${b}` });
  type Params = Parameters<typeof functor>;
  type Result = ReturnType<typeof functor>;

  expectType<Functor<never, unknown>>(functor);
  expectType<Method<never, never, unknown>>(functor);
  // @ts-expect-error(2345)
  expectType<Constructor<never, unknown>>(functor);
  // @ts-expect-error(2345)
  expectType<AbstractConstructor<never, unknown>>(functor);
  // @ts-expect-error(2345)
  expectType<Constructable<never, unknown>>(functor);
  expectType<Callable<never, unknown>>(functor);
  // @ts-expect-error(2345)
  expectType<Predicate<unknown, unknown>>(functor);

  type FunctorCases = [
    Expect<Equal<InferFunctor<typeof functor>, { Params: Params; Result: Result }>>,
    Expect<Equal<InferMethod<typeof functor>, { Context: unknown; Params: Params; Result: Result }>>,
    Expect<Equal<InferConstructor<typeof functor>, never>>,
    Expect<Equal<InferAbstractConstructor<typeof functor>, never>>,
    Expect<Equal<InferConstructable<typeof functor>, never>>,
    Expect<Equal<InferCallable<typeof functor>, { Params: Params; Result: Result }>>,
    Expect<Equal<InferPredicate<typeof functor>, never>>,
  ];
}

// should handle method
{
  const method = {
    a(this: { e: string }, a: number, b: string) {
      return { c: `${a}-${b}`, d: [] };
    },
  }["a"];
  type Context = ThisParameterType<typeof method>;
  type Params = Parameters<typeof method>;
  type Result = ReturnType<typeof method>;

  expectType<Functor<never, unknown>>(method);
  expectType<Method<never, never, unknown>>(method);
  // @ts-expect-error(2345)
  expectType<Constructor<never, unknown>>(method);
  // @ts-expect-error(2345)
  expectType<AbstractConstructor<never, unknown>>(method);
  // @ts-expect-error(2345)
  expectType<ProtoFunctor<never, unknown>>(method);
  // @ts-expect-error(2345)
  expectType<Constructable<never, unknown>>(method);
  expectType<Callable<never, unknown>>(method);
  // @ts-expect-error(2345)
  expectType<Predicate<unknown, unknown>>(method);

  type MethodCases = [
    Expect<Equal<InferFunctor<typeof method>, { Params: Params; Result: Result }>>,
    Expect<Equal<InferMethod<typeof method>, { Context: Context; Params: Params; Result: Result }>>,
    Expect<Equal<InferConstructor<typeof method>, never>>,
    Expect<Equal<InferAbstractConstructor<typeof method>, never>>,
    Expect<Equal<InferConstructable<typeof method>, never>>,
    Expect<Equal<InferCallable<typeof method>, { Params: Params; Result: Result }>>,
  ];
}

// should handle constructor
{
  class constructor {
    c: string;
    d: null[] = [];
    constructor(a: number, b: string) {
      this.c = `${a}-${b}`;
    }
  }
  type Instance = InstanceType<typeof constructor>;
  type Params = ConstructorParameters<typeof constructor>;

  // @ts-expect-error(2345)
  expectType<Functor<never, unknown>>(constructor);
  // @ts-expect-error(2345)
  expectType<Method<never, never, unknown>>(constructor);
  expectType<Constructor<never, unknown>>(constructor);
  expectType<AbstractConstructor<never, unknown>>(constructor);
  // @ts-expect-error(2345)
  expectType<ProtoFunctor<never, unknown>>(constructor);
  expectType<Constructable<never, unknown>>(constructor);
  expectType<Callable<never, unknown>>(constructor);

  type ConstructorCases = [
    Expect<Equal<InferFunctor<typeof constructor>, never>>,
    Expect<Equal<InferMethod<typeof constructor>, never>>,
    Expect<Equal<InferConstructor<typeof constructor>, { Instance: Instance; Params: Params }>>,
    Expect<Equal<InferAbstractConstructor<typeof constructor>, { Instance: Instance; Params: Params }>>,
    Expect<Equal<InferConstructable<typeof constructor>, { Instance: Instance; Params: Params }>>,
    Expect<Equal<InferCallable<typeof constructor>, { Params: Params; Result: Instance }>>,
  ];
}

// should handle abstract_constructor
{
  abstract class abstract_constructor {
    abstract c: string;
    d: null[] = [];
    constructor(a: number, b: string) {
      void a;
      void b;
    }
  }
  type Instance = InstanceType<typeof abstract_constructor>;
  type Params = ConstructorParameters<typeof abstract_constructor>;

  // @ts-expect-error(2345)
  expectType<Functor<never, unknown>>(abstract_constructor);
  // @ts-expect-error(2345)
  expectType<Method<never, never, unknown>>(abstract_constructor);
  // @ts-expect-error(2345)
  expectType<Constructor<never, unknown>>(abstract_constructor);
  expectType<AbstractConstructor<never, unknown>>(abstract_constructor);
  // @ts-expect-error(2345)
  expectType<ProtoFunctor<never, unknown>>(abstract_constructor);
  expectType<Constructable<never, unknown>>(abstract_constructor);
  expectType<Callable<never, unknown>>(abstract_constructor);

  type AbstractConstructorCases = [
    Expect<Equal<InferFunctor<typeof abstract_constructor>, never>>,
    Expect<Equal<InferMethod<typeof abstract_constructor>, never>>,
    Expect<Equal<InferConstructor<typeof abstract_constructor>, never>>,
    Expect<Equal<InferAbstractConstructor<typeof abstract_constructor>, { Instance: Instance; Params: Params }>>,
    Expect<Equal<InferConstructable<typeof abstract_constructor>, { Instance: Instance; Params: Params }>>,
    Expect<Equal<InferCallable<typeof abstract_constructor>, { Params: Params; Result: Instance }>>,
  ];
}

{
  type Params = [a: number, b: string];
  type Result = { c: string };
  type Context = { e: string };
  type Instance = { d: string };

  type FunctorType = { (...params: Params): Result; blah: string };
  type MethodType = { (this: Context, ...params: Params): Result; blah: string };
  type ConstructorType = { new (...params: Params): Instance; blah: string };
  type AbstractConstructorType = (abstract new (...params: Params) => Instance) & { blah: string };

  type InferFunctorSignCases = [
    Expect<Equal<InferFunctorSign<FunctorType>, Functor<Params, Result>>>,
    Expect<Equal<InferFunctorSign<MethodType>, Functor<Params, Result>>>,
    Expect<Equal<InferFunctorSign<ConstructorType>, never>>,
    Expect<Equal<InferFunctorSign<AbstractConstructorType>, never>>,
  ];

  type InferMethodSignCases = [
    Expect<Equal<InferMethodSign<FunctorType>, Method<unknown, Params, Result>>>,
    Expect<Equal<InferMethodSign<MethodType>, Method<Context, Params, Result>>>,
    Expect<Equal<InferMethodSign<ConstructorType>, never>>,
    Expect<Equal<InferMethodSign<AbstractConstructorType>, never>>,
  ];

  type InferConstructorSignCases = [
    Expect<Equal<InferConstructorSign<FunctorType>, never>>,
    Expect<Equal<InferConstructorSign<MethodType>, never>>,
    Expect<Equal<InferConstructorSign<ConstructorType>, { new (...params: Params): Instance }>>,
    Expect<Equal<InferConstructorSign<AbstractConstructorType>, never>>,
  ];

  type InferAbstractConstructorSignCases = [
    Expect<Equal<InferAbstractConstructorSign<FunctorType>, never>>,
    Expect<Equal<InferAbstractConstructorSign<MethodType>, never>>,
    Expect<Equal<InferAbstractConstructorSign<ConstructorType>, { new (...params: Params): Instance }>>,
    Expect<Equal<InferAbstractConstructorSign<AbstractConstructorType>, abstract new (...params: Params) => Instance>>,
  ];

  type InferConstructableSignCases = [
    Expect<Equal<InferConstructableSign<FunctorType>, never>>,
    Expect<Equal<InferConstructableSign<MethodType>, never>>,
    Expect<Equal<InferConstructableSign<ConstructorType>, { new (...params: Params): Instance }>>,
    Expect<Equal<InferConstructableSign<AbstractConstructorType>, abstract new (...params: Params) => Instance>>,
  ];

  type InferCallableSignCases = [
    Expect<Equal<InferCallableSign<FunctorType>, Functor<Params, Result>>>,
    Expect<Equal<InferCallableSign<MethodType>, Method<Context, Params, Result>>>,
    Expect<Equal<InferCallableSign<ConstructorType>, { new (...params: Params): Instance }>>,
    Expect<Equal<InferCallableSign<AbstractConstructorType>, abstract new (...params: Params) => Instance>>,
  ];
}

{
  const isStringUntyped = (value: string | number): boolean => true;
  const isStringTyped = (value: string | number): value is string => true;

  type PredicateCases = [
    Expect<Equal<InferPredicate<typeof isStringUntyped>, { Param: string | number; Result: string | number }>>,
    Expect<Equal<InferPredicate<typeof isStringTyped>, { Param: string | number; Result: string }>>,
    Expect<Equal<InferPredicate<(a: number, b: string) => boolean>, never>>,
  ];

  // @ts-expect-error(2345)
  expectType<TypedPredicate<string | number, string>>(isStringUntyped);
  expectType<TypedPredicate<string | number, string>>(isStringTyped);
  expectType<UntypedPredicate<string | number>>(isStringUntyped);
  expectType<UntypedPredicate<string | number>>(isStringTyped);
  expectType<Predicate<string | number, string>>(isStringUntyped);
  expectType<Predicate<string | number, string>>(isStringTyped);

  class Collection<Value> {
    values!: Value[];
    push(value: Value) {}
    typeCheck(checked: (value: Value) => void) {}

    typedFilter<P extends TypedPredicate<Value, Value>>(predicate: P): Collection<InferPredicate<P>["Result"]> {
      return new Collection();
    }
    untypedFilter<P extends UntypedPredicate<Value>>(predicate: P): Collection<InferPredicate<P>["Result"]> {
      return new Collection();
    }
    filter<P extends Predicate<Value, Value>>(predicate: P): Collection<InferPredicate<P>["Result"]> {
      return new Collection();
    }
  }

  const source = new Collection<string | number>();
  // @ts-expect-error(2345)
  source.typedFilter(isStringUntyped);
  source.typedFilter(isStringTyped).typeCheck((value) => {
    type ValueInferCase = Expect<Equal<typeof value, string>>;
  });
  source.untypedFilter(isStringUntyped).typeCheck((value) => {
    type ValueInferCase = Expect<Equal<typeof value, string | number>>;
  });
  source.untypedFilter(isStringTyped).typeCheck((value) => {
    type ValueInferCase = Expect<Equal<typeof value, string>>;
  });
  source.filter(isStringUntyped).typeCheck((value) => {
    type ValueInferCase = Expect<Equal<typeof value, string | number>>;
  });
  source.filter(isStringTyped).typeCheck((value) => {
    type ValueInferCase = Expect<Equal<typeof value, string>>;
  });
}

{
  const assertTruthy = (value: "blah" | "foo" | ""): asserts value => {};
  const assertBlah = (value: "blah" | "foo"): asserts value is "blah" => {};
  const voidReturn = (a: number | undefined): void => {};
  const neverReturn = (a: true | false): never => {
    throw new Error();
  };

  type AssertionCases = [
    Expect<Equal<InferAssertion<typeof assertTruthy>, { Param: "blah" | "foo" | ""; Result: "blah" | "foo" }>>,
    Expect<Equal<InferAssertion<typeof assertBlah>, { Param: "blah" | "foo"; Result: "blah" }>>,
    Expect<Equal<InferAssertion<typeof voidReturn>, never>>,
    Expect<Equal<InferAssertion<typeof neverReturn>, never>>,
    Expect<Equal<InferAssertion<(a: number, b: string) => void>, never>>,
  ];

  expectType<TypedAssertion<"blah" | "foo" | "", "blah" | "foo">>(assertTruthy);
  expectType<TypedAssertion<"blah" | "foo", "blah" | "foo">>(assertBlah);
  expectType<TypedAssertion<number | undefined, number>>(voidReturn);
  expectType<TypedAssertion<true | false, true>>(neverReturn);
  expectType<TruthyAssertion<"blah" | "foo" | "">>(assertTruthy);
  expectType<TruthyAssertion<"blah" | "foo">>(assertBlah);
  expectType<TruthyAssertion<number | undefined>>(voidReturn);
  expectType<TruthyAssertion<true | false>>(neverReturn);
  expectType<Assertion<"blah" | "foo" | "", "blah" | "foo">>(assertTruthy);
  expectType<Assertion<"blah" | "foo", "blah" | "foo">>(assertBlah);
  expectType<Assertion<number | undefined, number>>(voidReturn);
  expectType<Assertion<true | false, true>>(neverReturn);

  class Collection<Value> {
    values!: Value[];
    push(value: Value) {}
    typeCheck(checked: (value: Value) => void) {}

    assertionTypedFilter<A extends TypedAssertion<Value, Value>>(assertion: A): Collection<InferAssertion<A>["Result"]> {
      return new Collection();
    }
    assertionTruthyFilter<A extends TruthyAssertion<Value>>(assertion: A): Collection<InferAssertion<A>["Result"]> {
      return new Collection();
    }
    assertionFilter<A extends Assertion<Value, Value>>(assertion: A): Collection<InferAssertion<A>["Result"]> {
      return new Collection();
    }
  }

  const source = new Collection<"blah" | "foo" | "">();

  source.assertionTypedFilter(assertTruthy).typeCheck((value) => {
    type ValueInferCase = Expect<Equal<typeof value, "blah" | "foo">>;
  });
  source
    .assertionTypedFilter(assertTruthy)
    .assertionTypedFilter(assertBlah)
    .typeCheck((value) => {
      type ValueInferCase = Expect<Equal<typeof value, "blah">>;
    });
  // @ts-expect-error(2345)
  source.assertionTypedFilter(voidReturn);
  // @ts-expect-error(2345)
  source.assertionTypedFilter(neverReturn);

  source.assertionTruthyFilter(assertTruthy).typeCheck((value) => {
    type ValueInferCase = Expect<Equal<typeof value, "blah" | "foo">>;
  });
  source
    .assertionTruthyFilter(assertTruthy)
    .assertionTruthyFilter(assertBlah)
    .typeCheck((value) => {
      type ValueInferCase = Expect<Equal<typeof value, "blah">>;
    });
  // @ts-expect-error(2345)
  source.assertionTruthyFilter(voidReturn);
  // @ts-expect-error(2345)
  source.assertionTruthyFilter(neverReturn);

  source.assertionFilter(assertTruthy).typeCheck((value) => {
    type ValueInferCase = Expect<Equal<typeof value, "blah" | "foo">>;
  });
  source
    .assertionFilter(assertTruthy)
    .assertionFilter(assertBlah)
    .typeCheck((value) => {
      type ValueInferCase = Expect<Equal<typeof value, "blah">>;
    });
  // @ts-expect-error(2345)
  source.assertionFilter(voidReturn);
  // @ts-expect-error(2345)
  source.assertionFilter(neverReturn);
}
