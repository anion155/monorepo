declare const original: unique symbol;
declare const meta: unique symbol;

declare global {
  type Branded<Type, Name extends PropertyKey, Meta = never> = Type & {
    readonly [original]: Type extends Branded<infer Original, PropertyKey, unknown> ? Original : Type;
    readonly [meta]: { [name in Name]: Meta };
  };

  type BrandMeta<Brand extends Branded<unknown, PropertyKey, unknown>, Name extends keyof Brand[typeof meta]> = Brand[typeof meta][Name];

  type BrandType<Brand extends Branded<unknown, PropertyKey, unknown>> = Brand[typeof original];
}
