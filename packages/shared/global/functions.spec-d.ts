import { Equal, Expect, ExpectNot, Extends } from "../type-tests";
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

type FunctorCases = [
  // should only accept functor-like functions
  Expect<Equal<typeof functor, Functor<Params, Result>>>,
  Expect<Equal<typeof method, Functor<Params, Result>>>,
  ExpectNot<Extends<typeof constructor, Functor<Params, Result>>>,
  ExpectNot<Extends<typeof abstract_constructor, Functor<Params, Result>>>,
  Expect<Equal<typeof proto_function, Functor<Params, Result>>>,

  // should infer params and result, or return never
  Expect<Equal<InferFunctor<typeof functor>, { Params: Params; Result: Result }>>,
  Expect<Equal<InferFunctor<typeof method>, { Params: Params; Result: Result }>>,
  Expect<Equal<InferFunctor<typeof constructor>, never>>,
  Expect<Equal<InferFunctor<typeof abstract_constructor>, never>>,
  Expect<Equal<InferFunctor<typeof proto_function>, { Params: Params; Result: Result }>>,
  Expect<Equal<InferCallable<object>, never>>,
];

type MethodCases = [
  // should only accept method-like functions
  Expect<Equal<typeof functor, Method<{ e: string }, Params, Result>>>,
  Expect<Equal<typeof method, Method<{ e: string }, Params, Result>>>,
  ExpectNot<Extends<typeof constructor, Method<{ e: string }, Params, Result>>>,
  ExpectNot<Extends<typeof abstract_constructor, Method<{ e: string }, Params, Result>>>,
  Expect<Extends<typeof proto_function, Method<Result, Params, Result>>>,

  // should infer instance, params and result, or return never
  Expect<Equal<InferMethod<typeof functor>, { Instance: unknown; Params: Params; Result: Result }>>,
  Expect<Equal<InferMethod<typeof method>, { Instance: { e: string }; Params: Params; Result: Result }>>,
  Expect<Equal<InferMethod<typeof constructor>, never>>,
  Expect<Equal<InferMethod<typeof abstract_constructor>, never>>,
  Expect<Equal<InferMethod<typeof proto_function>, { Instance: Result; Params: Params; Result: Result }>>,
  Expect<Equal<InferCallable<object>, never>>,
];

type ConstructorCases = [
  // should only accept constructor-like functions
  ExpectNot<Extends<typeof functor, Constructor<Params, Result>>>,
  ExpectNot<Extends<typeof method, Constructor<Params, Result>>>,
  Expect<Extends<typeof constructor, Constructor<Params, Result>>>,
  ExpectNot<Extends<typeof abstract_constructor, Constructor<Params, Result>>>,
  ExpectNot<Extends<typeof proto_function, Constructor<Params, Result>>>,

  // should infer params and instance, or return never
  Expect<Equal<InferConstructor<typeof functor>, never>>,
  Expect<Equal<InferConstructor<typeof method>, never>>,
  Expect<Equal<InferConstructor<typeof constructor>, { Params: Params; Instance: Result }>>,
  Expect<Equal<InferConstructor<typeof abstract_constructor>, never>>,
  Expect<Equal<InferConstructor<typeof proto_function>, never>>,
  Expect<Equal<InferCallable<object>, never>>,
];

type AbstractConstructorCases = [
  // should only accept abstract constructor-like functions
  ExpectNot<Extends<typeof functor, AbstractConstructor<Params, Result>>>,
  ExpectNot<Extends<typeof method, AbstractConstructor<Params, Result>>>,
  Expect<Extends<typeof constructor, AbstractConstructor<Params, Result>>>,
  Expect<Extends<typeof abstract_constructor, AbstractConstructor<Params, Result>>>,
  ExpectNot<Extends<typeof proto_function, AbstractConstructor<Params, Result>>>,

  // should infer params and instance, or return never
  Expect<Equal<InferAbstractConstructor<typeof functor>, never>>,
  Expect<Equal<InferAbstractConstructor<typeof method>, never>>,
  Expect<Equal<InferAbstractConstructor<typeof constructor>, { Params: Params; Instance: Result }>>,
  Expect<Equal<InferAbstractConstructor<typeof abstract_constructor>, { Params: Params; Instance: Result }>>,
  Expect<Equal<InferAbstractConstructor<typeof proto_function>, never>>,
  Expect<Equal<InferCallable<object>, never>>,
];

type ProtoFunctorCases = [
  // should only accept function with prototype like functions
  Expect<Extends<typeof functor, ProtoFunctor<Params, Result>>>,
  ExpectNot<Extends<typeof method, ProtoFunctor<Params, Result>>>,
  ExpectNot<Extends<typeof constructor, ProtoFunctor<Params, Result>>>,
  ExpectNot<Extends<typeof abstract_constructor, ProtoFunctor<Params, Result>>>,
  Expect<Extends<typeof proto_function, ProtoFunctor<Params, Result>>>,

  // should infer params and instance, or return never
  Expect<Equal<InferProtoFunctor<typeof functor>, { Params: Params; Instance: Result }>>,
  Expect<Equal<InferProtoFunctor<typeof method>, never>>,
  Expect<Equal<InferProtoFunctor<typeof constructor>, never>>,
  Expect<Equal<InferProtoFunctor<typeof abstract_constructor>, never>>,
  Expect<Equal<InferProtoFunctor<typeof proto_function>, { Params: Params; Instance: Result }>>,
  Expect<Equal<InferCallable<object>, never>>,
];

type ConstructableCases = [
  // should only accept constructible-like functions
  Expect<Extends<typeof functor, Constructable<Params, Result>>>,
  ExpectNot<Extends<typeof method, Constructable<Params, Result>>>,
  Expect<Extends<typeof constructor, Constructable<Params, Result>>>,
  Expect<Extends<typeof abstract_constructor, Constructable<Params, Result>>>,
  Expect<Extends<typeof proto_function, Constructable<Params, Result>>>,

  // should infer params and instance, or return never
  Expect<Equal<InferConstructable<typeof functor>, { Params: Params; Instance: Result }>>,
  Expect<Equal<InferConstructable<typeof method>, never>>,
  Expect<Equal<InferConstructable<typeof constructor>, { Params: Params; Instance: Result }>>,
  Expect<Equal<InferConstructable<typeof abstract_constructor>, { Params: Params; Instance: Result }>>,
  Expect<Equal<InferConstructable<typeof proto_function>, { Params: Params; Instance: Result }>>,
  Expect<Equal<InferCallable<object>, never>>,
];

type CallableCases = [
  // should only accept any callable type
  Expect<Extends<typeof functor, Callable<Params, Result>>>,
  Expect<Extends<typeof method, Callable<Params, Result>>>,
  Expect<Extends<typeof constructor, Callable<Params, Result>>>,
  Expect<Extends<typeof abstract_constructor, Callable<Params, Result>>>,
  Expect<Extends<typeof proto_function, Callable<Params, Result>>>,

  // should infer params and result, or return never
  Expect<Equal<InferCallable<typeof functor>, { Params: Params; Result: Result }>>,
  Expect<Equal<InferCallable<typeof method>, { Params: Params; Result: Result }>>,
  Expect<Equal<InferCallable<typeof constructor>, { Params: Params; Result: Result }>>,
  Expect<Equal<InferCallable<typeof abstract_constructor>, { Params: Params; Result: Result }>>,
  Expect<Equal<InferCallable<typeof proto_function>, { Params: Params; Result: Result }>>,
  Expect<Equal<InferCallable<object>, never>>,
];
