import { getProperty } from "./object";

/**
 * Caches getter result.
 *
 * @example
 *  class Test {
 *    @cached
 *    get another() {
 *      // expensive operation with constant
 *      return new AnotherClass(this);
 *    }
 *  }
 */
export function cached<This extends object = object, Value = unknown>(
  getter: (this: This) => Value,
  { kind, name }: ClassGetterDecoratorContext<This, Value>,
) {
  if (kind !== "getter") return;
  return function (this: This): Value {
    const value = getter.apply(this);
    const { enumerable } = getProperty(this, name)!;
    Object.defineProperty(this, name, { value, writable: false, enumerable });
    return value;
  };
}

/**
 * Bounds method to instance.
 *
 * @example
 *  class Test {
 *    value = 1;
 *    @bound method() {
 *      return this.value + 5;
 *    }
 *  }
 *  const { method } = new Test();
 *  method() === 6;
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function bound<This = unknown, Value extends (this: This, ...args: any) => unknown = (this: This, ...args: any) => unknown>(
  method: Value,
  { kind, addInitializer, name }: ClassMethodDecoratorContext<This, Value>,
) {
  if (kind !== "method") return;
  addInitializer(function (this: This) {
    // @ts-expect-error - should be ok
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    this[name] = this[name].bind(this);
  });
}
