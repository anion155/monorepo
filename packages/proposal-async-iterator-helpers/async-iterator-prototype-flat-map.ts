import { polyfillProperty } from "@anion155/polyfill-base";
import { AsyncIteratorPrototype } from "./async-iterator-prototype";

import { AsyncIteratorConstructor } from "./async-iterator-constructor";
import "./async-iterator-from";

polyfillProperty(AsyncIteratorPrototype, "flatMap", {
  value: async function* flatMap<T, TReturn, TNext, U>(
    this: AsyncIterator<T, TReturn, TNext>,
    project: (value: T, index: number) => AsyncIterator<U> | AsyncIterable<U> | Iterable<U>,
  ): AsyncGenerator<U, TReturn, undefined> {
    let index = 0;
    while (true) {
      const result = await this.next();
      if (result.done) return result.value;
      yield* AsyncIteratorConstructor.from(project(result.value, index));
      index += 1;
    }
  },
});

export {};
