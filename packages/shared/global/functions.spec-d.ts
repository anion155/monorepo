import { Equal, Expect, ExpectNot, expectType } from "type-tests";
import "./functions";

const functor = (a: number, b: string) => ({ c: `${a}-${b}`, d: [] });

const method = {
  a(this: { e: string }, a: number, b: string) {
    return { c: `${a}-${b}`, d: [] };
  },
}["a"];

class constructor {
  c: string;
  d: null[] = [];
  constructor(a: number, b: string) {
    this.c = `${a}-${b}`;
  }
}

abstract class abstract_constructor {
  abstract c: string;
  d: null[] = [];
  constructor(a: number, b: string) {
    void a;
    void b;
  }
}

function proto_function(this: { c: string; d: null[] }, a: number, b: string) {
  this.c = `${a}-${b}`;
  return this;
}
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
proto_function.prototype.d = [] as null[];

type Params = [a: number, b: string];
type Result = { c: string; d: null[] };

// should only accept functor-like functions
expectType<Functor<Params, Result>>(functor);
expectType<Functor<Params, Result>>(method);
// @ts-expect-error(2345)
expectType<Functor<Params, Result>>(constructor);
// @ts-expect-error(2345)
expectType<Functor<Params, Result>>(abstract_constructor);
expectType<Functor<Params, Result>>(proto_function);

type FunctorCases = [
  // should infer params and result, or return never
  Expect<Equal<InferFunctor<typeof functor>, { Params: Params; Result: Result }>>,
  Expect<Equal<InferFunctor<typeof method>, { Params: Params; Result: Result }>>,
  Expect<Equal<InferFunctor<typeof constructor>, never>>,
  Expect<Equal<InferFunctor<typeof abstract_constructor>, never>>,
  Expect<Equal<InferFunctor<typeof proto_function>, { Params: Params; Result: Result }>>,
  Expect<Equal<InferCallable<object>, never>>,

  // should infer call signature
  ExpectNot<Equal<typeof functor & { test: string }, typeof functor>>,
  Expect<Equal<InferFunctorSign<typeof functor & { test: string }>, typeof functor>>,
];

// should only accept method-like functions
expectType<Method<{ e: string }, Params, Result>>(functor);
expectType<Method<{ e: string }, Params, Result>>(method);
// @ts-expect-error(2345)
expectType<Method<{ e: string }, Params, Result>>(constructor);
// @ts-expect-error(2345)
expectType<Method<{ e: string }, Params, Result>>(abstract_constructor);
expectType<Method<Result, Params, Result>>(proto_function);

type MethodCases = [
  // should infer instance, params and result, or return never
  Expect<Equal<InferMethod<typeof functor>, { Instance: unknown; Params: Params; Result: Result }>>,
  Expect<Equal<InferMethod<typeof method>, { Instance: { e: string }; Params: Params; Result: Result }>>,
  Expect<Equal<InferMethod<typeof constructor>, never>>,
  Expect<Equal<InferMethod<typeof abstract_constructor>, never>>,
  Expect<Equal<InferMethod<typeof proto_function>, { Instance: Result; Params: Params; Result: Result }>>,
  Expect<Equal<InferCallable<object>, never>>,
];

// should only accept constructor-like functions
// @ts-expect-error(2345)
expectType<Constructor<Params, Result>>(functor);
// @ts-expect-error(2345)
expectType<Constructor<Params, Result>>(method);
expectType<Constructor<Params, Result>>(constructor);
// @ts-expect-error(2345)
expectType<Constructor<Params, Result>>(abstract_constructor);
// @ts-expect-error(2345)
expectType<Constructor<Params, Result>>(proto_function);

type ConstructorCases = [
  // should infer params and instance, or return never
  Expect<Equal<InferConstructor<typeof functor>, never>>,
  Expect<Equal<InferConstructor<typeof method>, never>>,
  Expect<Equal<InferConstructor<typeof constructor>, { Params: Params; Instance: Result }>>,
  Expect<Equal<InferConstructor<typeof abstract_constructor>, never>>,
  Expect<Equal<InferConstructor<typeof proto_function>, never>>,
  Expect<Equal<InferCallable<object>, never>>,
];

// should only accept abstract constructor-like functions
// @ts-expect-error(2345)
expectType<AbstractConstructor<Params, Result>>(functor);
// @ts-expect-error(2345)
expectType<AbstractConstructor<Params, Result>>(method);
expectType<AbstractConstructor<Params, Result>>(constructor);
expectType<AbstractConstructor<Params, Result>>(abstract_constructor);
// @ts-expect-error(2345)
expectType<AbstractConstructor<Params, Result>>(proto_function);

type AbstractConstructorCases = [
  // should infer params and instance, or return never
  Expect<Equal<InferAbstractConstructor<typeof functor>, never>>,
  Expect<Equal<InferAbstractConstructor<typeof method>, never>>,
  Expect<Equal<InferAbstractConstructor<typeof constructor>, { Params: Params; Instance: Result }>>,
  Expect<Equal<InferAbstractConstructor<typeof abstract_constructor>, { Params: Params; Instance: Result }>>,
  Expect<Equal<InferAbstractConstructor<typeof proto_function>, never>>,
  Expect<Equal<InferCallable<object>, never>>,
];

// should only accept function with prototype like functions
expectType<ProtoFunctor<Params, Result>>(functor);
// @ts-expect-error(2345)
expectType<ProtoFunctor<Params, Result>>(method);
// @ts-expect-error(2345)
expectType<ProtoFunctor<Params, Result>>(constructor);
// @ts-expect-error(2345)
expectType<ProtoFunctor<Params, Result>>(abstract_constructor);
expectType<ProtoFunctor<Params, Result>>(proto_function);

type ProtoFunctorCases = [
  // should infer params and instance, or return never
  Expect<Equal<InferProtoFunctor<typeof functor>, { Params: Params; Instance: Result }>>,
  Expect<Equal<InferProtoFunctor<typeof method>, never>>,
  Expect<Equal<InferProtoFunctor<typeof constructor>, never>>,
  Expect<Equal<InferProtoFunctor<typeof abstract_constructor>, never>>,
  Expect<Equal<InferProtoFunctor<typeof proto_function>, { Params: Params; Instance: Result }>>,
  Expect<Equal<InferCallable<object>, never>>,
];

// should only accept constructible-like functions
expectType<Constructable<Params, Result>>(functor);
// @ts-expect-error(2345)
expectType<Constructable<Params, Result>>(method);
expectType<Constructable<Params, Result>>(constructor);
expectType<Constructable<Params, Result>>(abstract_constructor);
expectType<Constructable<Params, Result>>(proto_function);

type ConstructableCases = [
  // should infer params and instance, or return never
  Expect<Equal<InferConstructable<typeof functor>, { Params: Params; Instance: Result }>>,
  Expect<Equal<InferConstructable<typeof method>, never>>,
  Expect<Equal<InferConstructable<typeof constructor>, { Params: Params; Instance: Result }>>,
  Expect<Equal<InferConstructable<typeof abstract_constructor>, { Params: Params; Instance: Result }>>,
  Expect<Equal<InferConstructable<typeof proto_function>, { Params: Params; Instance: Result }>>,
  Expect<Equal<InferCallable<object>, never>>,
];

// should only accept any callable type
expectType<Callable<Params, Result>>(functor);
expectType<Callable<Params, Result>>(method);
expectType<Callable<Params, Result>>(constructor);
expectType<Callable<Params, Result>>(abstract_constructor);
expectType<Callable<Params, Result>>(proto_function);

type CallableCases = [
  // should infer params and result, or return never
  Expect<Equal<InferCallable<typeof functor>, { Params: Params; Result: Result }>>,
  Expect<Equal<InferCallable<typeof method>, { Params: Params; Result: Result }>>,
  Expect<Equal<InferCallable<typeof constructor>, { Params: Params; Result: Result }>>,
  Expect<Equal<InferCallable<typeof abstract_constructor>, { Params: Params; Result: Result }>>,
  Expect<Equal<InferCallable<typeof proto_function>, { Params: Params; Result: Result }>>,
  Expect<Equal<InferCallable<object>, never>>,
];
