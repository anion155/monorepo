/**
 * Error class mixin
 *
 * @example
 * export class NotImplementedYet extends createErrorClass("NotImplementedYet", "this functionality isn't implemented yet") {}
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createErrorClass<Base extends Constructor<any[], Error> = typeof Error>(
  name: string,
  defaultMessage?: string,
  Base: Base = Error as never,
) {
  interface SpecificError {
    readonly [Symbol.toStringTag]: string;
  }
  class SpecificError extends Base {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...[message, ...params]: any[]) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      super(message ?? defaultMessage, ...params);
    }
  }
  Object.defineProperty(SpecificError.prototype, Symbol.toStringTag, { value: name, configurable: true });
  Object.defineProperty(SpecificError.prototype, "name", { value: name, writable: true, configurable: true, enumerable: true });
  return SpecificError;
}
