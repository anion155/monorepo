import { AsyncIteratorConstructor } from "./async-iterator-constructor";
import { polyfillProperty } from "./base";

polyfillProperty(globalThis, "AsyncIterator", {
  value: AsyncIteratorConstructor,
});

export {};
