import { polyfillProperty } from "@anion155/polyfill-base";

import { IteratorPrototype } from "./iterator-prototype";

polyfillProperty(IteratorPrototype, "drop", {
  value: function* drop<T, TReturn, TNext>(this: Iterator<T, TReturn, TNext>, limit: number): Generator<T, TReturn, TNext> {
    let index = 0;
    while (true) {
      const result = this.next();
      if (result.done) return result.value;
      if (index >= limit) yield result.value;
      index += 1;
    }
  },
});

export {};
