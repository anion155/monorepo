import { polyfillProperty } from "@anion155/polyfill-base";
import { IteratorPrototype } from "@anion155/proposal-iterator-helpers/iterator-prototype";

polyfillProperty(IteratorPrototype, "toAsync", {
  // eslint-disable-next-line @typescript-eslint/require-await
  value: async function* toAsync<T, TReturn, TNext>(this: Iterator<T, TReturn, TNext>): AsyncGenerator<T, TReturn, TNext> {
    while (true) {
      const result = this.next();
      if (result.done) return result.value;
      yield result.value;
    }
  },
});

export {};
