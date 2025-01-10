declare global {
  type Functor<Params extends unknown[], Result> = { (...args: Params): Result };
  type InferFunctor<_Functor> = _Functor extends Functor<infer Params extends unknown[], infer Result> ? { Params: Params; Result: Result } : never;

  type Method<Instance, Params extends unknown[], Result> = { (this: Instance, ...args: Params): Result };
  type InferMethod<_Method> =
    _Method extends Method<infer Instance, infer Params extends unknown[], infer Result>
      ? { Instance: Instance; Params: Params; Result: Result }
      : never;

  type Constructor<Params extends unknown[], Instance> = { new (...args: Params): Instance };
  type InferConstructor<_Constructor> =
    _Constructor extends Constructor<infer Params extends unknown[], infer Instance> ? { Params: Params; Instance: Instance } : never;

  type AbstractConstructor<Params extends unknown[], Instance> = abstract new (...args: Params) => Instance;
  type InferAbstractConstructor<_AbstractConstructor> =
    _AbstractConstructor extends AbstractConstructor<infer Params extends unknown[], infer Instance> ? { Params: Params; Instance: Instance } : never;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type ProtoFunctor<Params extends unknown[], Instance> = { (this: Instance, ...args: Params): Instance } & { prototype: any };
  type InferProtoFunctor<_ProtoFunctor> =
    _ProtoFunctor extends ProtoFunctor<infer Params extends unknown[], infer Instance> ? { Params: Params; Instance: Instance } : never;

  type Constructable<Params extends unknown[], Instance> =
    | AbstractConstructor<Params, Instance>
    | Constructor<Params, Instance>
    | ProtoFunctor<Params, Instance>;
  type InferConstructable<_Constructable> =
    _Constructable extends ProtoFunctor<infer Params, infer Instance>
      ? { Params: Params; Instance: Instance }
      : InferAbstractConstructor<_Constructable>;

  type Callable<Params extends unknown[], Result> = Constructable<Params, Result> | Method<unknown, Params, Result> | Functor<Params, Result>;
  type InferCallable<_Callable> =
    _Callable extends Constructable<infer Params, infer Result> ? { Params: Params; Result: Result } : InferFunctor<_Callable>;
}
