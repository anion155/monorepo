import { AsyncIteratorPrototype } from "./async-iterator-prototype";
import { polyfillProperty } from "./base";

polyfillProperty(AsyncIteratorPrototype, "every", {
  value: async function every<T, TReturn, TNext>(
    this: AsyncIterator<T, TReturn, TNext>,
    predicate: (value: T, index: number) => boolean | Promise<boolean>,
  ): Promise<boolean> {
    let index = 0;
    while (true) {
      const result = await this.next();
      if (result.done === true) return true;
      if (!(await predicate(result.value, index))) {
        await this.return?.(undefined);
        return false;
      }
      index += 1;
    }
  },
});

export {};
