import { polyfillProperty } from "@anion155/polyfill-base";

import { IteratorPrototype } from "./iterator-prototype";

polyfillProperty(IteratorPrototype, "some", {
  value: function some<T, TReturn, TNext>(this: Iterator<T, TReturn, TNext>, predicate: (value: T, index: number) => boolean): boolean {
    let index = 0;
    while (true) {
      const result = this.next();
      if (result.done) return false;
      if (predicate(result.value, index)) {
        this.return?.(undefined);
        return true;
      }
      index += 1;
    }
  },
});

export {};
