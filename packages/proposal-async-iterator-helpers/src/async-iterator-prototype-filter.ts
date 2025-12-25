import { AsyncIteratorPrototype } from "./async-iterator-prototype";
import { polyfillProperty } from "./base";

polyfillProperty(AsyncIteratorPrototype, "filter", {
  value: async function* filter<T, TReturn, TNext>(
    this: AsyncIterator<T, TReturn, TNext>,
    predicate: (value: T, index: number) => boolean | Promise<boolean>,
  ): AsyncGenerator<T, TReturn, TNext> {
    let index = 0;
    while (true) {
      const result = await this.next();
      if (result.done === true) return result.value;
      if (await predicate(result.value, index)) {
        yield result.value;
      }
      index += 1;
    }
  },
});

export {};
