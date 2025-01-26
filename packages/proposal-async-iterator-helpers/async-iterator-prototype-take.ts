import { polyfillProperty } from "@anion155/polyfill-base";
import { AsyncIteratorPrototype } from "./async-iterator-prototype";

polyfillProperty(AsyncIteratorPrototype, "take", {
  value: async function* take<T, TReturn, TNext>(
    this: AsyncIterator<T, TReturn, TNext>,
    limit: number,
  ): AsyncGenerator<T, T | TReturn | undefined, TNext> {
    let index = 0;
    while (true) {
      if (index >= limit) {
        if (!this.return) return undefined;
        const result = await this.return(undefined);
        return result.value;
      }
      const result = await this.next();
      if (result.done) return result.value;
      yield result.value;
      index += 1;
    }
  },
});

export {};
