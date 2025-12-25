import { AsyncIteratorPrototype } from "./async-iterator-prototype";
import { polyfillProperty } from "./base";

polyfillProperty(AsyncIteratorPrototype, "drop", {
  value: async function* drop<T, TReturn, TNext>(this: AsyncIterator<T, TReturn, TNext>, limit: number): AsyncGenerator<T, TReturn, TNext> {
    let index = 0;
    while (true) {
      const result = await this.next();
      if (result.done === true) return result.value;
      if (index >= limit) yield result.value;
      index += 1;
    }
  },
});

export {};
