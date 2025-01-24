import { IteratorPrototype } from "./iterator-prototype";
import { polyfillProperty } from "./polyfill";

polyfillProperty(IteratorPrototype, "every", {
  value: function every<T, TReturn, TNext>(this: Iterator<T, TReturn, TNext>, predicate: (value: T, index: number) => boolean): boolean {
    let index = 0;
    while (true) {
      const result = this.next();
      if (result.done) return true;
      if (!predicate(result.value, index)) {
        this.return?.(undefined);
        return false;
      }
      index += 1;
    }
  },
});

export {};
