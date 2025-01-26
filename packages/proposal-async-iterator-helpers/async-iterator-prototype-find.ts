import { polyfillProperty } from "@anion155/polyfill-base";
import { AsyncIteratorPrototype } from "./async-iterator-prototype";

polyfillProperty(AsyncIteratorPrototype, "find", {
  value: async function find<T, TReturn, TNext>(
    this: AsyncIterator<T, TReturn, TNext>,
    predicate: (value: T, index: number) => boolean | Promise<boolean>,
  ): Promise<T | undefined> {
    let index = 0;
    while (true) {
      const result = await this.next();
      if (result.done) return undefined;
      if (await predicate(result.value, index)) {
        await this.return?.(undefined);
        return result.value;
      }
      index += 1;
    }
  },
});

export {};
