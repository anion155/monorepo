import { Curried, curryHelper } from "./functional";

type TypeOfMap = {
  string: string;
  number: number;
  bigint: bigint;
  boolean: boolean;
  symbol: symbol;
  undefined: undefined;
  object: object;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  function: Function;
};

/** Tests if value is an object */
export function isObject(value: unknown): value is object {
  return typeof value === "object" && value !== null;
}

/** Creates predicate that tests if value has field */
export function hasField<Key extends string | symbol | number>(key: Key): Curried<(value: object) => value is { [k in Key]: unknown }>;
/** Tests if value has field */
export function hasField<Key extends string | symbol | number>(value: object, key: Key): value is { [k in Key]: unknown };
export function hasField(...params: [key: string | symbol | number] | [value: object, key: string | symbol | number]) {
  if (params.length === 1) {
    return curryHelper((value: object) => hasField(value, params[0]));
  }
  return params[1] in params[0];
}

/** Creates predicate that tests if value has own field */
export function hasOwnField<Key extends string | symbol | number>(key: Key): Curried<(value: object) => value is { [k in Key]: unknown }>;
/** Tests if value has own field */
export function hasOwnField<Key extends string | symbol | number>(value: object, key: Key): value is { [k in Key]: unknown };
export function hasOwnField<Key extends string | symbol | number>(...params: [key: Key] | [value: object, key: Key]) {
  if (params.length === 1) {
    return curryHelper((value: object) => hasOwnField(value, params[0]));
  }
  return Object.prototype.hasOwnProperty.call(params[0], params[1]);
}

/** Creates predicate that tests if value is of type */
export function isTypeOf<Type extends keyof TypeOfMap>(type: Type): Curried<(value: unknown) => value is TypeOfMap[Type]>;
/** Tests if value is of type */
export function isTypeOf<Type extends keyof TypeOfMap>(value: unknown, type: Type): value is TypeOfMap[Type];
export function isTypeOf(...params: [type: keyof TypeOfMap] | [value: unknown, type: keyof TypeOfMap]) {
  if (params.length === 1) {
    return curryHelper((value: unknown) => isTypeOf(value, params[0]));
  }
  const [value, type] = params;
  switch (type) {
    case "object":
      return isObject(value);
    case "undefined":
      return value === undefined;
    default:
      return typeof value === type;
  }
}

/** Creates predicate that tests if value is an error */
export function isError<ErrorClass extends Constructable<never, Error>>(
  ErrorClass: ErrorClass,
): Curried<(value: unknown) => value is InferConstructable<ErrorClass>["Instance"]>;
/** Tests if value is an error */
export function isError<ErrorClass extends Constructable<never, Error>>(
  value: unknown,
  ErrorClass: ErrorClass,
): value is InferConstructable<ErrorClass>["Instance"];
export function isError<ErrorClass extends Constructable<never, Error>>(
  ...params: [ErrorClass: ErrorClass] | [value: unknown, ErrorClass: ErrorClass]
) {
  if (params.length === 1) {
    return curryHelper((value: unknown) => isError(value, params[0]));
  }
  const [value, ErrorClass] = params;
  const name = (ErrorClass.prototype as Error).name;
  if (value instanceof ErrorClass) return true;
  if (value instanceof Error) return value.name === name;
  return (
    isObject(value) &&
    hasField(value, "name") &&
    isTypeOf(value.name, "string") &&
    value.name === name &&
    hasField(value, "message") &&
    isTypeOf(value.message, "string")
  );
}

type IsType = Constructable<never, unknown> | keyof TypeOfMap;
type IsInferInstance<Type extends IsType> = Type extends keyof TypeOfMap
  ? TypeOfMap[Type]
  : Type extends ObjectConstructor
    ? object
    : InferConstructable<Type>["Instance"];
/** Creates predicate that tests if value is of specified type */
export function is<Type extends IsType>(constrOrType: Type): Curried<(value: unknown) => value is IsInferInstance<Type>>;
/** Tests if value is of specified type */
export function is<Type extends IsType>(value: unknown, constrOrType: Type): value is IsInferInstance<Type>;
export function is<Type extends IsType>(...params: [constrOrType: Type] | [value: unknown, constrOrType: Type]) {
  if (params.length === 1) {
    const constrOrType = params[0];
    if (typeof constrOrType === "string") return curryHelper((value: unknown) => isTypeOf(value, constrOrType));
    const constr = constrOrType as Constructable<unknown[], unknown>;
    if (Object.is(constr, Object)) return curryHelper((value: unknown) => isObject(value));
    if (constr.prototype instanceof Error) return curryHelper((value: unknown) => isError(value, constr as Constructable<unknown[], Error>));
    return curryHelper((value: unknown) => is(value, constrOrType));
  }
  const [value, constrOrType] = params;
  if (typeof constrOrType === "string") return isTypeOf(value, constrOrType);
  const constr = constrOrType as Constructable<unknown[], unknown>;
  if (Object.is(constr, Object)) return isObject(value);
  if (constr.prototype instanceof Error) return isError(value, constr as Constructable<unknown[], Error>);
  if (value instanceof constr) return true;
  if (value === undefined || value === null) return false;
  return value.constructor === constr;
}

/** Tests if value is promise like */
export function isPromiseLike<T>(value: unknown): value is PromiseLike<T> {
  return isObject(value) && hasField(value, "then") && isTypeOf(value.then, "function");
}

/** Tests if value is truthy */
export const isTruthy: <Value>(value: Value) => value is Exclude<Value, Falsy> = Boolean as never;
