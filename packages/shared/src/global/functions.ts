declare global {
  /**
   * Generic functor type, any type that can be called like in example
   *
   * @example
   * declare const params: Params
   * declare const result: Result
   * result = something(...params)
   */
  type Functor<Params extends unknown[], Result> = { (...params: Params): Result };
  /** Infers functor's params and result */
  type InferFunctor<_Functor> = _Functor extends Functor<infer Params, infer Result> ? { Params: Params; Result: Result } : never;
  /** Infers functor's call signature */
  type InferFunctorSign<_Functor extends Functor<never, unknown>> =
    _Functor extends Functor<infer Params, infer Result> ? Functor<Params, Result> : never;

  /**
   * Generic method type, any type that can be called with context like in example
   *
   * @example
   * declare const context: Context
   * declare const params: Params
   * declare const result: Result
   * result = context.something(...params)
   */
  type Method<Context, Params extends unknown[], Result> = { (this: Context, ...params: Params): Result };
  /** Infers methods's context, params and result */
  type InferMethod<_Method> =
    _Method extends Method<infer Context, infer Params, infer Result> ? { Context: Context; Params: Params; Result: Result } : never;
  /** Infers method's call signature */
  type InferMethodSign<_Method extends Method<never, never, unknown>> =
    _Method extends Method<infer Context, infer Params, infer Result> ? Method<Context, Params, Result> : never;

  /**
   * Generic constructor type, any typeof class
   *
   * @example
   * declare class Instance {}
   * declare const params: Params
   * declare const instance: Instance
   * instance = new Instance(params)
   */
  type Constructor<Params extends unknown[], Instance> = { new (...params: Params): Instance };
  /** Infers constructor's params and instance */
  type InferConstructor<_Constructor> =
    _Constructor extends Constructor<infer Params, infer Instance> ? { Params: Params; Instance: Instance } : never;

  /**
   * Generic abstract constructor type, any typeof abstract class
   *
   * @example
   * declare abstract class AInstance {}
   * declare class Instance extends AInstance {}
   * declare const params: Params
   * declare const instance: AInstance
   * instance = new Instance(params)
   */
  type AbstractConstructor<Params extends unknown[], Instance> = abstract new (...params: Params) => Instance;
  /** Infers abstract constructor's params and instance */
  type InferAbstractConstructor<_AbstractConstructor> =
    _AbstractConstructor extends AbstractConstructor<infer Params, infer Instance> ? { Params: Params; Instance: Instance } : never;

  /**
   * Generic constructable type
   *
   * @example
   * declare const params: Params
   * declare const instance: Instance
   * instance = Reflect.construct(Constructor, params)
   */
  type Constructable<Params extends unknown[], Instance> = AbstractConstructor<Params, Instance> | Constructor<Params, Instance>;
  /** Infers constructible params and instance */
  type InferConstructable<_Constructable> =
    _Constructable extends Constructor<infer Params, infer Instance>
      ? { Params: Params; Instance: Instance }
      : _Constructable extends AbstractConstructor<infer Params, infer Instance>
        ? { Params: Params; Instance: Instance }
        : never;

  /**
   * Generic callable type
   *
   * @example
   * declare const params: Params
   * declare const context: unknown
   * declare const result: Result
   * result = Reflect.apple(callable, context, params)
   */
  type Callable<Params extends unknown[], Result> = Constructable<Params, Result> | Functor<Params, Result> | Method<never, Params, Result>;
  /** Infers constructible params and result */
  type InferCallable<_Callable> =
    _Callable extends Constructable<infer Params, infer Result>
      ? { Params: Params; Result: Result }
      : _Callable extends Method<never, infer Params, infer Result>
        ? { Params: Params; Result: Result }
        : _Callable extends Functor<infer Params, infer Result>
          ? { Params: Params; Result: Result }
          : never;

  /** Typed Predicate function type */
  type TypedPredicate<Param, Result extends Param> = { (value: Param): value is Result };
  /** Untyped predicate function type */
  type UntypedPredicate<Param> = { (value: Param): boolean };
  /**
   * Predicate function type
   *
   * @example
   * declare class Collection<Value> {
   *   filter<P extends Predicate<unknown, unknown>>(predicate: P): Collection<InferPredicate<P>['Result']>
   * }
   * new Collection<string | number>().filter((value): value is string => typeof value === 'string'); // Collection<string>
   * new Collection<string | number>().filter((value) => typeof value === 'string'); // Collection<string>
   */
  type Predicate<Param, Result extends Param> = TypedPredicate<Param, Result> | UntypedPredicate<Param>;
  /** Infers predicate's param and result */
  type InferPredicate<_Predicate> =
    _Predicate extends TypedPredicate<infer Param, infer Result>
      ? { Param: Param; Result: Result }
      : _Predicate extends UntypedPredicate<infer Param>
        ? { Param: Param; Result: Param }
        : never;

  /** Truthy assertion function type */
  type TruthyAssertion<Param> = { (value: Param): asserts value };
  /** Type assertion function type */
  type TypedAssertion<Param, Result extends Param> = { (value: Param): asserts value is Result };
  /**
   * Assertion function type.
   *
   * @example
   * declare class Collection<Value> {
   *   assertionFilter<P extends Assertion<unknown, unknown>>(predicate: P): Collection<InferPredicate<P>['Result']>
   * }
   * new Collection<string | undefined>().assertionFilter((value): asserts value => {
   *   if (!value) throw new AssertionError(value)
   * }); // Collection<string>
   * new Collection<string | number>().assertionFilter((value): asserts value is string => {
   *   if (typeof value !== "string") throw new AssertionError(value)
   * }); // Collection<string>
   */
  type Assertion<Param, Result extends Param> = TruthyAssertion<Param> | TypedAssertion<Param, Result>;
  /** Infers assertion's param and result */
  type InferAssertion<_Assertion> =
    _Assertion extends TypedAssertion<infer Param, infer Result>
      ? IfEquals<
          _Assertion,
          Functor<[Param], void>,
          never,
          IfEquals<
            ReturnType<_Assertion>,
            never,
            never,
            IfEquals<Param, Result, { Param: Param; Result: Exclude<Param, Falsy> }, { Param: Param; Result: Result }>
          >
        >
      : never;
}
