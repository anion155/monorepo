import { polyfillProperty } from "@anion155/polyfill-base";
import { SuppressedError } from "./suppressed-error";

polyfillProperty(globalThis, "SuppressedError", {
  value: SuppressedError,
});

export {};
