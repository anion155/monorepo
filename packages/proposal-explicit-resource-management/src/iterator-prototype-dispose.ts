import "./global-symbols";

import { polyfillProperty } from "@anion155/polyfill-base";

import { IteratorPrototype } from "./utils";

polyfillProperty(IteratorPrototype, Symbol.dispose, {
  value: function dispose<T, TReturn, TNext>(this: Iterator<T, TReturn, TNext>): void {
    this.return?.();
  },
});

export {};
