import { IteratorConstructor } from "./iterator-constructor";
import { polyfillProperty } from "./polyfill";

polyfillProperty(globalThis, "Iterator", {
  value: IteratorConstructor,
});

export {};
