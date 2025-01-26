import { polyfillProperty } from "@anion155/polyfill-base";
import { AsyncIteratorPrototype } from "./async-iterator-prototype";

polyfillProperty(AsyncIteratorPrototype, "map", {
  value: async function* map<T, TReturn, TNext, U>(
    this: AsyncIterator<T, TReturn, TNext>,
    project: (value: T, index: number) => U | Promise<U>,
  ): AsyncGenerator<U, TReturn, TNext> {
    let index = 0;
    while (true) {
      const result = await this.next();
      if (result.done) return result.value;
      yield project(result.value, index);
      index += 1;
    }
  },
});

export {};
