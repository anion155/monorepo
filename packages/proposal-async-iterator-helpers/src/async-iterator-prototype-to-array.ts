import { polyfillProperty } from "@anion155/polyfill-base";

import { AsyncIteratorPrototype } from "./async-iterator-prototype";

polyfillProperty(AsyncIteratorPrototype, "toArray", {
  value: async function toArray<T, TReturn, TNext>(this: AsyncIterator<T, TReturn, TNext>): Promise<T[]> {
    const items: T[] = [];
    while (true) {
      const result = await this.next();
      if (result.done === true) return items;
      items.push(result.value);
    }
  },
});

export {};
