/**
 * Asserts that passed value is `true`:
 */
export type Expect<_T extends true> = never;

/**
 * Asserts that passed value is `false`:
 */
export type ExpectNot<_T extends false> = never;

/**
 * Checks if X extends Y.
 */
export type Extends<X, Y> = X extends Y ? true : false;

/**
 * Checks if X and Y values are equal types.
 */
export type Equal<X, Y> = IfEquals<X, Y, true, false>;
