import { polyfillProperty } from "@anion155/polyfill-base";

import { AsyncIteratorPrototype } from "./async-iterator-prototype";

polyfillProperty(AsyncIteratorPrototype, "some", {
  value: async function some<T, TReturn, TNext>(
    this: AsyncIterator<T, TReturn, TNext>,
    predicate: (value: T, index: number) => boolean | Promise<boolean>,
  ): Promise<boolean> {
    let index = 0;
    while (true) {
      const result = await this.next();
      if (result.done === true) return false;
      if (await predicate(result.value, index)) {
        await this.return?.(undefined);
        return true;
      }
      index += 1;
    }
  },
});

export {};
