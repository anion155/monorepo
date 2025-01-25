import { polyfillProperty } from "@anion155/polyfill-base";
import { IteratorPrototype } from "./iterator-prototype";

polyfillProperty(IteratorPrototype, "take", {
  value: function* take<T, TReturn, TNext>(this: Iterator<T, TReturn, TNext>, limit: number): Generator<T, T | TReturn | undefined, TNext> {
    let index = 0;
    while (true) {
      if (index >= limit) {
        return this.return?.(undefined).value;
      }
      const result = this.next();
      if (result.done) return result.value;
      yield result.value;
      index += 1;
    }
  },
});

export {};
