import { polyfillProperty } from "./base";
import { IteratorPrototype } from "./iterator-prototype";

polyfillProperty(IteratorPrototype, "filter", {
  value: function* filter<T, TReturn, TNext>(
    this: Iterator<T, TReturn, TNext>,
    predicate: (value: T, index: number) => boolean,
  ): Generator<T, TReturn, TNext> {
    let index = 0;
    while (true) {
      const result = this.next();
      if (result.done) return result.value;
      if (predicate(result.value, index)) {
        yield result.value;
      }
      index += 1;
    }
  },
});

export {};
