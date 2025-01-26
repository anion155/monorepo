import { polyfillProperty } from "@anion155/polyfill-base";
import { AsyncIteratorConstructor } from "./async-iterator-constructor";

polyfillProperty(globalThis, "AsyncIterator", {
  value: AsyncIteratorConstructor,
});

export {};
