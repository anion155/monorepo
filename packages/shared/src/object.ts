import { hasTypedField } from "./is";

export type PropertyDescriptorAccessorReadonly<Value> = {
  value?: undefined;
  writable?: undefined;
  get: () => Value;
  set?: undefined;
  enumerable?: boolean;
  configurable?: boolean;
};
export type PropertyDescriptorValueReadonly<Value> = {
  value?: Value;
  writable: false;
  get?: undefined;
  set?: undefined;
  enumerable?: boolean;
  configurable?: boolean;
};
export type PropertyDescriptorAccessorWritable<Value> = {
  value?: undefined;
  writable?: undefined;
  get: () => Value;
  set?: (value: Value) => void;
  enumerable?: boolean;
  configurable?: boolean;
};
export type PropertyDescriptorValueWritable<Value> = {
  value?: Value;
  writable?: true;
  get?: undefined;
  set?: undefined;
  enumerable?: boolean;
  configurable?: boolean;
};
export type PropertyDescriptorReadonly<Value> = PropertyDescriptorAccessorReadonly<Value> | PropertyDescriptorValueReadonly<Value>;
export type PropertyDescriptorWritable<Value> = PropertyDescriptorAccessorWritable<Value> | PropertyDescriptorValueWritable<Value>;
export type StronglyTypedPropertyDescriptor<Value> = PropertyDescriptorReadonly<Value> | PropertyDescriptorWritable<Value>;

type DefineProperty<Target extends object, Key extends keyof Target> =
  Key extends ReadonlyKeys<Target> ? PropertyDescriptorReadonly<Target[Key]> : PropertyDescriptorWritable<Target[Key]>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AppendProperty<Key extends string | symbol, Descriptor extends StronglyTypedPropertyDescriptor<any>> =
  Descriptor extends PropertyDescriptorReadonly<infer V>
    ? undefined extends V
      ? { readonly [k in Key]?: V }
      : { readonly [k in Key]: V }
    : Descriptor extends PropertyDescriptorWritable<infer V>
      ? undefined extends V
        ? { [k in Key]?: V }
        : { [k in Key]: V }
      : never;

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
 * const obj = {} as { value: number };
 * defineProperty(obj, "value", { value: 42 });
 */
export function defineProperty<Target extends object, Key extends keyof Target>(target: Target, key: Key, descriptor: DefineProperty<Target, Key>) {
  if (hasTypedField(descriptor, "get", "function") || hasTypedField(descriptor, "set", "function")) {
    const { get, set, enumerable = true, configurable = true } = descriptor;
    Object.defineProperty(target, key, { get, set, enumerable, configurable });
  } else {
    const { value, writable = true, enumerable = true, configurable = true } = descriptor;
    Object.defineProperty(target, key, { value, writable, enumerable, configurable });
  }
}

/**
 * Define method on {@link target}. Target's type should already has appropriate method
 *
 * @example
 * const obj = {} as { test(): number };
 * defineMethod(obj, "test", () => 5);
 */
export function defineMethod<Target extends object, Key extends MethodsKeys<Target>>(
  target: Target,
  key: Key,
  method: (this: Target, ...params: InferMethod<Target[Key]>["Params"]) => InferMethod<Target[Key]>["Result"],
) {
  defineProperty(target, key, { value: method } as never);
}

/**
 * Gets all own properties from {@link values} and defines them in {@link target}.
 * Properties should be in type of {@link target}.
 *
 * @example
 * const target = { } as { b: number};
 * defineProperties(target, { @accessor b: 42 });
 * Object.getOwnPropertyDescriptor(target, "b"); // { get, set }
 */
export function defineProperties<Target extends object>(target: Target, values: Partial<Target>) {
  const keys = [...Object.getOwnPropertyNames(values), ...Object.getOwnPropertySymbols(values)] as Array<keyof Target>;
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(values, key)!;
    if (
      !hasTypedField(descriptor, "get", "function") &&
      !hasTypedField(descriptor, "set", "function") &&
      hasTypedField(descriptor, "value", "function")
    ) {
      Object.defineProperty(target, key, { value: descriptor.value, enumerable: true, configurable: true, writable: true });
    } else {
      Object.defineProperty(target, key, descriptor);
    }
  }
}

/**
 * Define property on {@link target} and update it's type by asserting
 *
 * @example
 * const obj = {}
 * appendProperty(obj, "value", { value: 42 });
 */
export function appendProperty<Target extends object, Key extends string | symbol, Descriptor extends StronglyTypedPropertyDescriptor<unknown>>(
  target: Target,
  key: Key,
  descriptor: Descriptor,
): asserts target is Target & AppendProperty<Key, Descriptor> {
  defineProperty(target, key as never, descriptor as never) as never;
}

/**
 * Define method on {@link target} and update it's type by asserting
 *
 * @example
 * const obj = {}
 * appendMethod(obj, "test", () => 5);
 */
export function appendMethod<Target extends object, Key extends string | symbol, _Method extends Method<Target, never, unknown>>(
  target: Target,
  key: Key,
  method: _Method,
): asserts target is Target & { [k in Key]: _Method } {
  defineProperty(target, key as never, { value: method } as never);
}

/**
 * Gets all own properties from {@link values} and defines them in {@link target} and update it's type by asserting.
 *
 * @example
 * const target = { };
 * appendProperties(target, { @accessor b: 42 });
 * Object.getOwnPropertyDescriptor(target, "b"); // { get, set }
 */
export function appendProperties<Target extends object, Values extends object>(target: Target, values: Values): asserts target is Target & Values {
  defineProperties(target, values);
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
 * const obj = { value: 42 };
 * updateProperty(obj, "value", { enumerable: false });
 */
export function updateProperty<Target extends object, Key extends keyof Target>(
  target: Target,
  key: Key,
  updates: Partial<TypedPropertyDescriptor<Target[Key]>>,
) {
  modifyProperty(target, key, (current) => ({ ...current, ...updates }));
}

/**
 * Assigns all own properties from {@link values} to {@link target}.
 *
 * @example
 * const target = assignProperties({ }, { @accessor b: 42 });
 * Object.getOwnPropertyDescriptor(target, "b"); // { get, set }
 */
export function assignProperties<Target extends object, Values extends object>(target: Target, values: Values): Extend<Target, Values> {
  defineProperties(target, values);
  return target as never;
}

/**
 * Create object  all own properties from {@link values} to {@link target}.
 *
 * @example
 * const target = create({ a: 1 }, { @accessor b: 42 });
 * Object.getOwnPropertyDescriptor(target, "1"); // undefined
 * Object.getOwnPropertyDescriptor(target, "b"); // { get, set }
 */
export function create<Proto extends object, Values extends object>(proto: Proto, values: Values): Extend<Proto, Values> {
  const target = Object.create(proto) as Extend<Proto, Values>;
  defineProperties(target, values);
  return target;
}

/** Determines whether an object exists in another object's prototype chain */
export function isPrototypeOf(proto: object, target: object): boolean {
  return Object.prototype.isPrototypeOf.call(proto, target);
}
