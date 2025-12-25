import { polyfillProperty } from "./base";
import { IteratorConstructor } from "./iterator-constructor";

polyfillProperty(globalThis, "Iterator", {
  value: IteratorConstructor,
});

export {};
