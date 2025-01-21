import { curryHelper } from "./functional";

type TypeOfMap = {
  string: string;
  number: number;
  bigint: bigint;
  boolean: boolean;
  symbol: symbol;
  undefined: undefined;
  object: object;
  function: Callable<unknown[], unknown>;
  promise: PromiseLike<unknown>;
};

/** Tests if value is an object */
export function isObject(value: unknown): value is object {
  return typeof value === "object" && value !== null;
}

/** Tests if value has field */
export function hasField<Key extends string | symbol | number>(value: object, key: Key): value is { [k in Key]: unknown } {
  return key in value;
}
/** Creates predicate that tests if value has field */
hasField.create = function createHasField<Key extends string | symbol | number>(key: Key) {
  return curryHelper((value: object): value is { [k in Key]: unknown } => hasField(value, key));
};
/** Tests if value has own field */
function hasOwnField<Key extends string | symbol | number>(value: object, key: Key): value is { [k in Key]: unknown } {
  return Object.prototype.hasOwnProperty.call(value, key);
}
/** Creates predicate that tests if value has own field */
hasOwnField.create = function createHasOwnField<Key extends string | symbol | number>(key: Key) {
  return curryHelper((value: object): value is { [k in Key]: unknown } => hasOwnField(value, key));
};
hasField.own = hasOwnField;

/** Tests if value is promise like */
export function isPromiseLike<T>(value: unknown): value is PromiseLike<T> {
  return isObject(value) && hasField(value, "then") && typeof value.then === "function";
}

/** Tests if value is of type */
export function isTypeOf<Type extends keyof TypeOfMap>(value: unknown, type: Type): value is TypeOfMap[Type] {
  switch (type) {
    case "object":
      return isObject(value);
    case "undefined":
      return value === undefined;
    case "promise":
      return isPromiseLike(value);
    default:
      return typeof value === type;
  }
}
/** Creates predicate that tests if value is of type */
isTypeOf.create = function createIsTypeOf<Type extends keyof TypeOfMap>(type: Type) {
  return curryHelper((value: unknown): value is TypeOfMap[Type] => isTypeOf(value, type));
};

/** Tests if value is an error */
export function isError<ErrorClass extends Constructable<never, Error>>(
  value: unknown,
  ErrorClass: ErrorClass,
): value is InferConstructable<ErrorClass>["Instance"] {
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
/** Creates predicate that tests if value is an error */
isError.create = function createIsError<ErrorClass extends Constructable<never, Error>>(ErrorClass: ErrorClass) {
  return curryHelper((value: unknown): value is InferConstructable<ErrorClass>["Instance"] => isError(value, ErrorClass));
};

type IsType = Constructable<never, unknown> | keyof TypeOfMap;
type IsInferInstance<Type extends IsType> = Type extends keyof TypeOfMap
  ? TypeOfMap[Type]
  : Type extends ObjectConstructor
    ? object
    : InferConstructable<Type>["Instance"];
/** Tests if value is of specified type */
export function is<Type extends IsType>(value: unknown, constrOrType: Type): value is IsInferInstance<Type> {
  if (typeof constrOrType === "string") return isTypeOf(value, constrOrType);
  const constr = constrOrType as Constructable<unknown[], unknown>;
  if (Object.is(constr, Object)) return isObject(value);
  if (constr.prototype instanceof Error) return isError(value, constr as Constructable<unknown[], Error>);
  if (value instanceof constr) return true;
  if (value === undefined || value === null) return false;
  return value.constructor === constr;
}
/** Creates predicate that tests if value is of specified type */
is.create = function createIs<Type extends IsType>(constrOrType: Type) {
  return curryHelper((value: unknown): value is IsInferInstance<Type> => is(value, constrOrType));
};

/** Tests if value is truthy */
export const isTruthy: <Value>(value: Value) => value is Exclude<Value, Falsy> = Boolean as never;
