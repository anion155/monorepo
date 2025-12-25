import { polyfillProperty } from "./base";
import { IteratorPrototype } from "./utils";

polyfillProperty(IteratorPrototype, "toAsync", {
  // eslint-disable-next-line @typescript-eslint/require-await
  value: async function* toAsync<T, TReturn, TNext>(this: Iterator<T, TReturn, TNext>): AsyncGenerator<T, TReturn, TNext> {
    while (true) {
      const result = this.next();
      if (result.done === true) return result.value;
      yield result.value;
    }
  },
});

export {};
