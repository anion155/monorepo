export function createErrorClass(name: string, defaultMessage?: string) {
  class SpecificError extends Error {
    constructor(message?: string) {
      super(message ?? defaultMessage);
    }
    declare readonly [Symbol.toStringTag]: string;
  }
  Object.defineProperty(SpecificError.prototype, Symbol.toStringTag, { value: name, configurable: true });
  Object.defineProperty(SpecificError.prototype, "name", { value: name, writable: true, configurable: true, enumerable: true });
  return SpecificError;
}

export class DeveloperError extends createErrorClass("DeveloperError", "should never happen in runtime") {}
export function never(message?: string): never {
  throw new DeveloperError(message);
}

export class NotImplementedYet extends createErrorClass("NotImplementedYet", "this functionality isn't implemented yet") {}
/** @deprecated */
export function TODO(message?: string): never {
  throw new NotImplementedYet(message);
}
