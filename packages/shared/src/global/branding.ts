declare const original: unique symbol;
declare const meta: unique symbol;

declare global {
  /**
   * Creates branded version of Type, allow to store Meta and original type
   *
   * @example
   * type UserId = Branded<string,
   */
  type Branded<Type, Name extends PropertyKey, Meta = never> = Type & {
    readonly [original]: Type extends Branded<infer Original, PropertyKey, unknown> ? Original : Type;
    readonly [meta]: { [name in Name]: Meta };
  };

  /** Returns branded type meta */
  type BrandMeta<Brand extends Branded<unknown, PropertyKey, unknown>, Name extends keyof Brand[typeof meta]> = Brand[typeof meta][Name];

  /** Returns branded type original type */
  type BrandType<Brand extends Branded<unknown, PropertyKey, unknown>> = Brand[typeof original];
}
