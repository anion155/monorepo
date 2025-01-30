import { createErrorClass } from "./errors";

export class AssertionError extends createErrorClass("AssertionError") {
  constructor(
    public readonly value: unknown,
    message?: string,
  ) {
    super(`${message ?? "assertion failed"}: ${String(value)}`);
  }
}

/** Asserts {@link value} */
export function assert(value: unknown, message?: string): asserts value {
  if (!value) {
    throw new AssertionError(value, message);
  }
}

/** Asserts {@link value} using predicate. */
export function assertPredicate<Pred extends Predicate<never, never>>(
  predicate: Pred,
  value: NoInfer<InferPredicate<Pred>["Param"]>,
  message?: string,
): asserts value is InferPredicate<Pred>["Result"] {
  if (!predicate(value)) {
    throw new AssertionError(value, message);
  }
}
/**
 * Creates assertion function that uses predicate and asserts if value comply with it
 *
 * @example
 * const assertString: AssertPredicate<typeof isString> = assertPredicate.create(isString, "string assertion failed");
 * assertString(value)
 * value; // string
 */
assertPredicate.create =
  <Pred extends Predicate<never, never>>(predicate: Pred, defaultMessage?: string): AssertPredicate<Pred> =>
  (value, message) =>
    assertPredicate(predicate, value, message ?? defaultMessage);

/**
 * Helper type of assertion function based on predicate function.
 *
 * @example
 * const assertString: AssertPredicate<typeof isString> = assertPredicate.create(isString, "string assertion failed");
 * assertString(value)
 * value; // string
 */
export type AssertPredicate<Pred extends Predicate<never, never>> = {
  (value: InferPredicate<Pred>["Param"], message?: string): asserts value is InferPredicate<Pred>["Result"];
};
