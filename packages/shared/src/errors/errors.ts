import { createErrorClass } from "./create-error-class";

export class DeveloperError extends createErrorClass("DeveloperError", "should never happen in runtime") {}
export function UNREACHABLE(message?: string): never {
  throw new DeveloperError(message);
}

export class NotImplementedYet extends createErrorClass("NotImplementedYet", "this functionality isn't implemented yet") {}
/** @deprecated */
export function TODO(message?: string): never {
  throw new NotImplementedYet(message);
}
