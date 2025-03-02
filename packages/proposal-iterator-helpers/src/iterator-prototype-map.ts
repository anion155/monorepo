import { polyfillProperty } from "@anion155/polyfill-base";

import { IteratorPrototype } from "./iterator-prototype";

polyfillProperty(IteratorPrototype, "map", {
  value: function* map<T, TReturn, TNext, U>(
    this: Iterator<T, TReturn, TNext>,
    project: (value: T, index: number) => U,
  ): Generator<U, TReturn, TNext> {
    let index = 0;
    while (true) {
      const result = this.next();
      if (result.done) return result.value;
      yield project(result.value, index);
      index += 1;
    }
  },
});

export {};
