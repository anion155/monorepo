import { polyfillProperty } from "./base";
import { SuppressedError } from "./suppressed-error";

polyfillProperty(globalThis, "SuppressedError", {
  value: SuppressedError,
});

export {};
