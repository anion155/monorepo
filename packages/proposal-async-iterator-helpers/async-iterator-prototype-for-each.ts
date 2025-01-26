import { polyfillProperty } from "@anion155/polyfill-base";
import { AsyncIteratorPrototype } from "./async-iterator-prototype";

polyfillProperty(AsyncIteratorPrototype, "forEach", {
  value: async function forEach<T, TReturn, TNext>(
    this: AsyncIterator<T, TReturn, TNext>,
    callback: (value: T, index: number) => void | Promise<void>,
  ): Promise<void> {
    let index = 0;
    while (true) {
      const result = await this.next();
      if (result.done) return;
      await callback(result.value, index);
      index += 1;
    }
  },
});

export {};
