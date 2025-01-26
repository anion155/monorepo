import { polyfillProperty } from "@anion155/polyfill-base";
import { IteratorPrototype } from "@anion155/proposal-iterator-helpers/iterator-prototype";

import "./global-symbols";

polyfillProperty(IteratorPrototype, Symbol.dispose, {
  value: function dispose<T, TReturn, TNext>(this: Iterator<T, TReturn, TNext>): void {
    this.return?.();
  },
});

export {};
