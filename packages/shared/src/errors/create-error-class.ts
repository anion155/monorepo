/**
 * Error class mixin
 *
 * @example
 * export class NotImplementedYet extends createErrorClass("NotImplementedYet", "this functionality isn't implemented yet") {}
 */
export function createErrorClass(name: string, defaultMessage?: string) {
  interface SpecificError {
    readonly [Symbol.toStringTag]: string;
  }
  class SpecificError extends Error {
    constructor(message?: string) {
      super(message ?? defaultMessage);
    }
  }
  Object.defineProperty(SpecificError.prototype, Symbol.toStringTag, { value: name, configurable: true });
  Object.defineProperty(SpecificError.prototype, "name", { value: name, writable: true, configurable: true, enumerable: true });
  return SpecificError;
}
