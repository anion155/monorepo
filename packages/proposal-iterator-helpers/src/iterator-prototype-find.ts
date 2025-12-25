import { polyfillProperty } from "./base";
import { IteratorPrototype } from "./iterator-prototype";

polyfillProperty(IteratorPrototype, "find", {
  value: function find<T, TReturn, TNext>(this: Iterator<T, TReturn, TNext>, predicate: (value: T, index: number) => boolean): T | undefined {
    let index = 0;
    while (true) {
      const result = this.next();
      if (result.done) return undefined;
      if (predicate(result.value, index)) {
        this.return?.(undefined);
        return result.value;
      }
      index += 1;
    }
  },
});

export {};
