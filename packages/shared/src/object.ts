import "./global/utils";

export type PropertyDescriptorAccessorReadonly<Value> = {
  value?: undefined;
  writable?: undefined;
  get: () => Value;
  set?: undefined;
  enumerable?: boolean;
  configurable?: boolean;
};
export type PropertyDescriptorValueReadonly<Value> = {
  value: Value;
  writable?: false;
  get?: undefined;
  set?: undefined;
  enumerable?: boolean;
  configurable?: boolean;
};
export type PropertyDescriptorMethod<Value extends (...params: never) => unknown> = {
  value: Value;
  writable?: boolean;
  get?: undefined;
  set?: undefined;
  enumerable?: boolean;
  configurable?: boolean;
};
export type PropertyDescriptorAccessorWritable<Value> = {
  value?: undefined;
  writable?: undefined;
  get: () => Value;
  set: (value: Value) => void;
  enumerable?: boolean;
  configurable?: boolean;
};
export type PropertyDescriptorValueWritable<Value> = {
  value: Value;
  writable: true;
  get?: undefined;
  set?: undefined;
  enumerable?: boolean;
  configurable?: boolean;
};
export type PropertyDescriptorReadonly<Value> = PropertyDescriptorAccessorReadonly<Value> | PropertyDescriptorValueReadonly<Value>;
export type PropertyDescriptorWritable<Value> = PropertyDescriptorAccessorWritable<Value> | PropertyDescriptorValueWritable<Value>;
export type StronglyTypedPropertyDescriptor<Value> = Value extends (...params: never) => unknown
  ? PropertyDescriptorMethod<Value>
  : PropertyDescriptorReadonly<Value> | PropertyDescriptorWritable<Value>;

export type DefineProperty<Target extends object, Key extends keyof Target> =
  Key extends ReadonlyKeys<Target> ? PropertyDescriptorReadonly<Target[Key]> : PropertyDescriptorWritable<Target[Key]>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AppendProperty<Key extends string | symbol, Descriptor extends StronglyTypedPropertyDescriptor<any>> =
  Descriptor extends PropertyDescriptorMethod<infer V>
    ? { [K in Key]: V }
    : Descriptor extends PropertyDescriptorReadonly<infer V>
      ? undefined extends V
        ? { readonly [k in Key]?: V }
        : { readonly [k in Key]: V }
      : Descriptor extends PropertyDescriptorWritable<infer V>
        ? undefined extends V
          ? { [k in Key]?: V }
          : { [k in Key]: V }
        : never;

type AppendProperties<Properties extends { [key: string | symbol]: StronglyTypedPropertyDescriptor<unknown> }> = Omit<
  UnionToIntersection<{ [Key in keyof Properties]: Key extends string | symbol ? AppendProperty<Key, Properties[Key]> : never }[keyof Properties]>,
  never
>;

type UpdateProperty<Target extends object, Key extends keyof Target> = Target[Key] extends (...params: never) => unknown
  ? {
      value?: Target[Key];
      writable?: true;
      get?: undefined;
      set?: undefined;
      enumerable?: boolean;
      configurable?: boolean;
    }
  : Key extends WritableKeys<Target>
    ? {
        value?: Target[Key];
        writable?: true;
        get?: () => Target[Key];
        set?: (value: Target[Key]) => void;
        enumerable?: boolean;
        configurable?: boolean;
      }
    : {
        value?: Target[Key];
        writable?: false;
        get?: () => Target[Key];
        set?: (value: Target[Key]) => void;
        enumerable?: boolean;
        configurable?: boolean;
      };

/** Get object's own property descriptor */
export function getOwnProperty<Target extends object, Key extends keyof Target | (string & {}) | (symbol & {})>(
  target: Target,
  key: Key,
): Key extends keyof Target
  ? (Key extends ReadonlyKeys<Target> ? PropertyDescriptorReadonly<Target[Key]> : PropertyDescriptorWritable<Target[Key]>) | undefined
  : undefined {
  return Object.getOwnPropertyDescriptor(target, key) as never;
}

/** Get object's property descriptor. Recursively checks all prototypes */
export function getProperty<Target extends object, Key extends keyof Target | (string & {}) | (symbol & {})>(
  target: Target,
  key: Key,
): Key extends keyof Target
  ? Key extends ReadonlyKeys<Target>
    ? PropertyDescriptorReadonly<Target[Key]>
    : PropertyDescriptorWritable<Target[Key]>
  : undefined {
  const descriptor = getOwnProperty(target, key);
  if (descriptor) return descriptor as never;
  const proto = Object.getPrototypeOf(target) as object | null;
  if (proto === null) return undefined as never;
  return getProperty(proto, key as never);
}

/**
 * Define property on {@link target}. Target's type should already has appropriate property
 *
 * @example
 *  const obj = {} as { value: number };
 *  defineProperty(obj, "value", { value: 42 });
 */
export function defineProperty<Target extends object, Key extends keyof Target>(target: Target, key: Key, descriptor: DefineProperty<Target, Key>) {
  Object.defineProperty(target, key, descriptor);
}

export type WithToStringTag = { readonly [Symbol.toStringTag]: string };

/** Define standard to string tag prototype property. */
export function defineToStringTag(Class: { prototype: WithToStringTag; name: string }) {
  defineProperty(Class.prototype, Symbol.toStringTag, { value: Class.name, writable: false, enumerable: false, configurable: true });
}

/**
 * Define method on {@link target}. Target's type should already has appropriate method
 *
 * @example
 *  const obj = {} as { test(): number };
 *  defineMethod(obj, "test", () => 5);
 */
export function defineMethod<Target extends object, Key extends MethodsKeys<Target>>(
  target: Target,
  key: Key,
  method: (this: Target, ...params: InferMethod<Target[Key]>["Params"]) => InferMethod<Target[Key]>["Result"],
) {
  Object.defineProperty(target, key, { value: method, writable: true, enumerable: false, configurable: true });
}

/**
 * Define {@link properties} on {@link target}. Target's type should already has appropriate properties
 *
 * @example
 *  const target = { } as { a: number, b: number };
 *  defineProperties(target, { a: { value: 1 }, b: { value: 2 } });
 *  Object.getOwnPropertyDescriptor(target, "a"); // { value: 1 }
 *  Object.getOwnPropertyDescriptor(target, "b"); // { value: 2 }
 */
export function defineProperties<Target extends object>(target: Target, properties: { [Key in keyof Target]?: DefineProperty<Target, Key> }) {
  Object.defineProperties(target, properties as never);
}

/**
 * Define properties of {@link values} on {@link target}. Target's type should already has appropriate properties
 *
 * @example
 *  const target = { } as { a: number, b: number };
 *  definePropertiesFrom(target, { a: 1, b: 2 });
 *  Object.getOwnPropertyDescriptor(target, "a"); // { value: 1 }
 *  Object.getOwnPropertyDescriptor(target, "b"); // { value: 2 }
 */
export function definePropertiesFrom<Target extends object>(target: Target, values: Partial<Target>) {
  const keys = [...Object.getOwnPropertyNames(values), ...Object.getOwnPropertySymbols(values)] as Array<keyof Target>;
  for (const key of keys) {
    const descriptor = getOwnProperty(values, key)!;
    Object.defineProperty(target, key, descriptor);
  }
}

/**
 * Define property on {@link target} and update it's type by asserting
 *
 * @example
 *  const obj = {}
 *  appendProperty(obj, "value", { value: 42 });
 */
export function appendProperty<Target extends object, Key extends string | symbol, Descriptor extends StronglyTypedPropertyDescriptor<unknown>>(
  target: Target,
  key: Key,
  descriptor: Descriptor,
): asserts target is Omit<Target & AppendProperty<Key, Descriptor>, never> {
  defineProperty(target, key as never, descriptor as never);
}

/**
 * Define method on {@link target} and update it's type by asserting
 *
 * @example
 *  const obj = {}
 *  appendMethod(obj, "test", () => 5);
 */
export function appendMethod<Target extends object, Key extends string | symbol, _Method extends Method<Target, never, unknown>>(
  target: Target,
  key: Key,
  method: _Method,
): asserts target is Omit<Target & { [k in Key]: _Method }, never> {
  Object.defineProperty(target, key as never, { value: method as never, writable: true, enumerable: false, configurable: true });
}

/**
 * Define properties on {@link target} and update it's type by asserting
 *
 * @example
 *  const target = { };
 *  appendProperties(target, { b: { value: 42 } });
 *  Object.getOwnPropertyDescriptor(target, "b"); // { value: 42 }
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function appendProperties<Target extends object, Properties extends { [key: string | symbol]: StronglyTypedPropertyDescriptor<any> }>(
  target: Target,
  properties: Properties,
): asserts target is Omit<Target & AppendProperties<Properties>, never> {
  defineProperties(target, properties as never);
}

/**
 * Gets all own properties from {@link values} and defines them in {@link target} and update it's type by asserting.
 *
 * @example
 *  const target = { };
 *  appendProperties(target, { @accessor b: 42 });
 *  Object.getOwnPropertyDescriptor(target, "b"); // { get, set }
 */
export function appendPropertiesFrom<Target extends object, Values extends object>(
  target: Target,
  values: Values,
): asserts target is Omit<Target & Values, never> {
  definePropertiesFrom(target, values);
}

/** Utility to modify property descriptor */
export function modifyProperty<Target extends object, Key extends keyof Target>(
  target: Target,
  key: Key,
  modifier: (descriptor: TypedPropertyDescriptor<Target[Key]> | undefined) => TypedPropertyDescriptor<Target[Key]>,
) {
  defineProperty(target, key, modifier(getProperty(target, key)) as never);
}

/** Utility to modify method */
export function modifyMethod<Target extends object, Key extends MethodsKeys<Target>>(
  target: Target,
  key: Key,
  modifier: (original: Target[Key]) => Target[Key],
) {
  defineMethod(target, key, modifier(target[key]) as never);
}

/**
 * Utility to update property descriptor
 *
 * @example
 *  const obj = { value: 42 };
 *  updateProperty(obj, "value", { enumerable: false });
 */
export function updateProperty<Target extends object, Key extends keyof Target>(
  target: Target,
  key: Key,
  updates: UpdateProperty<NoInfer<Target>, NoInfer<Key>>,
) {
  Object.defineProperty(target, key, updates);
}

/**
 * Utility to update properties descriptors
 *
 * @example
 *  const obj = { value: 42 };
 *  updateProperties(obj, "value", { enumerable: false });
 */
export function updateProperties<Target extends object>(
  target: Target,
  // eslint-disable-next-line @typescript-eslint/no-wrapper-object-types
  updates: { [Key in Exclude<keyof NoInfer<Target>, keyof Object>]?: UpdateProperty<NoInfer<Target>, Key> },
) {
  Object.defineProperties(target, updates as never);
}

/**
 * Assigns all own properties from {@link values} to {@link target}.
 *
 * @example
 *  const target = assignProperties({ }, { @accessor b: 42 });
 *  Object.getOwnPropertyDescriptor(target, "b"); // { get, set }
 */
export function assignProperties<Target extends object, Values extends object>(target: Target, values: Values): Extend<Target, Values> {
  definePropertiesFrom(target, values);
  return target as never;
}

/**
 * Create object  all own properties from {@link values} to {@link target}.
 *
 * @example
 *  const target = create({ a: 1 }, { @accessor b: 42 });
 *  Object.getOwnPropertyDescriptor(target, "1"); // undefined
 *  Object.getOwnPropertyDescriptor(target, "b"); // { get, set }
 */
export function create<Proto extends object, Properties extends { [key: string | symbol]: StronglyTypedPropertyDescriptor<unknown> }>(
  proto: Proto,
  properties: Properties,
): Extend<Proto, AppendProperties<Properties>> {
  const target = Object.create(proto) as Proto;
  appendProperties(target, properties);
  return target;
}

/**
 * Create object  all own properties from {@link values} to {@link target}.
 *
 * @example
 *  const target = create({ a: 1 }, { @accessor b: 42 });
 *  Object.getOwnPropertyDescriptor(target, "1"); // undefined
 *  Object.getOwnPropertyDescriptor(target, "b"); // { get, set }
 */
export function createFrom<Proto extends object, Values extends object>(proto: Proto, values: Values): Extend<Proto, Values> {
  const target = Object.create(proto) as Extend<Proto, Values>;
  definePropertiesFrom(target, values);
  return target;
}

/** Determines whether an object exists in another object's prototype chain */
export function isPrototypeOf(proto: object, target: object): boolean {
  return Object.prototype.isPrototypeOf.call(proto, target);
}
