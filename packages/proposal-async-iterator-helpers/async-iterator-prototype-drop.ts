import { polyfillProperty } from "@anion155/polyfill-base";
import { AsyncIteratorPrototype } from "./async-iterator-prototype";

polyfillProperty(AsyncIteratorPrototype, "drop", {
  value: async function* drop<T, TReturn, TNext>(this: AsyncIterator<T, TReturn, TNext>, limit: number): AsyncGenerator<T, TReturn, TNext> {
    let index = 0;
    while (true) {
      const result = await this.next();
      if (result.done) return result.value;
      if (index >= limit) yield result.value;
      index += 1;
    }
  },
});

export {};
