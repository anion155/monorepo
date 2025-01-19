declare global {
  /**
   * Generic functor type, any type that can be called like in example
   *
   * @example
   * declare const args: Args
   * declare const result: Result
   * result = something(...args)
   */
  type Functor<Params extends unknown[], Result> = { (...args: Params): Result };
  /** Infers functor's params and result */
  type InferFunctor<_Functor> = _Functor extends Functor<infer Params extends unknown[], infer Result> ? { Params: Params; Result: Result } : never;
  /** Infers functor's call signature */
  type InferFunctorSign<_Functor extends Functor<never, unknown>> =
    _Functor extends Functor<infer Params extends unknown[], infer Result> ? Functor<Params, Result> : never;

  /**
   * Generic method type, any type that can be called with context like in example
   *
   * @example
   * declare const instance: Instance
   * declare const args: Args
   * declare const result: Result
   * result = instance.something(...args)
   */
  type Method<Instance, Params extends unknown[], Result> = { (this: Instance, ...args: Params): Result };
  /** Infers methods's instance, params and result */
  type InferMethod<_Method> =
    _Method extends Method<infer Instance, infer Params extends unknown[], infer Result>
      ? { Instance: Instance; Params: Params; Result: Result }
      : never;

  /**
   * Generic constructor type, any typeof class
   *
   * @example
   * declare class Instance {}
   * declare const args: Args
   * declare const instance: Instance
   * instance = new Instance(args)
   */
  type Constructor<Params extends unknown[], Instance> = { new (...args: Params): Instance };
  /** Infers constructor's params and instance */
  type InferConstructor<_Constructor> =
    _Constructor extends Constructor<infer Params extends unknown[], infer Instance> ? { Params: Params; Instance: Instance } : never;

  /**
   * Generic abstract constructor type, any typeof abstract class
   *
   * @example
   * declare abstract class AInstance {}
   * declare class Instance extends AInstance {}
   * declare const args: Args
   * declare const instance: AInstance
   * instance = new Instance(args)
   */
  type AbstractConstructor<Params extends unknown[], Instance> = abstract new (...args: Params) => Instance;
  /** Infers abstract constructor's params and instance */
  type InferAbstractConstructor<_AbstractConstructor> =
    _AbstractConstructor extends AbstractConstructor<infer Params extends unknown[], infer Instance> ? { Params: Params; Instance: Instance } : never;

  /**
   * Generic function with prototype
   *
   * @example
   * interface Instance {}
   * declare function InstanceConstructor(): Instance
   * InstanceConstructor.prototype = {} as Instance
   *
   * declare const args: Args
   * declare const instance: Instance
   * instance = new Instance(args)
   * instance = Instance(args)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type ProtoFunctor<Params extends unknown[], Instance> = { (this: Instance, ...args: Params): Instance } & { prototype: any };
  /** Infers function with prototype params and instance */
  type InferProtoFunctor<_ProtoFunctor> =
    _ProtoFunctor extends ProtoFunctor<infer Params extends unknown[], infer Instance> ? { Params: Params; Instance: Instance } : never;

  /**
   * Generic constructible type
   *
   * @example
   * declare const args: Args
   * declare const instance: Instance
   * instance = Reflect.construct(Constructor, args)
   */
  type Constructable<Params extends unknown[], Instance> =
    | AbstractConstructor<Params, Instance>
    | Constructor<Params, Instance>
    | ProtoFunctor<Params, Instance>;
  /** Infers constructible params and instance */
  type InferConstructable<_Constructable> =
    _Constructable extends ProtoFunctor<infer Params, infer Instance>
      ? { Params: Params; Instance: Instance }
      : InferAbstractConstructor<_Constructable>;

  /**
   * Generic callable type
   *
   * @example
   * declare const args: Args
   * declare const context: unknown
   * declare const result: Result
   * result = Reflect.apple(callable, context, args)
   */
  type Callable<Params extends unknown[], Result> = Constructable<Params, Result> | Functor<Params, Result>;
  /** Infers constructible params and result */
  type InferCallable<_Callable> =
    _Callable extends Constructable<infer Params, infer Result>
      ? { Params: Params; Result: Result }
      : _Callable extends Functor<infer Params extends unknown[], infer Result>
        ? { Params: Params; Result: Result }
        : never;
}
