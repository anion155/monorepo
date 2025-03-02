import { polyfillProperty } from "@anion155/polyfill-base";

import { IteratorConstructor } from "./iterator-constructor";

polyfillProperty(globalThis, "Iterator", {
  value: IteratorConstructor,
});

export {};
