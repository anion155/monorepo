import { AsyncIteratorPrototype } from "./async-iterator-prototype";
import { polyfillProperty } from "./base";

polyfillProperty(AsyncIteratorPrototype, "reduce", {
  value: async function reduce<T, TReturn, TNext, U>(
    this: AsyncIterator<T, TReturn, TNext>,
    reducer: (aggregation: U, value: T, index: number) => U | Promise<U>,
    ...args: [initialValue: U] | []
  ): Promise<U> {
    let index = 0;
    let aggregation: U = args[0] as never;
    let initiated = args.length > 0;
    while (true) {
      const result = await this.next();
      if (result.done === true) return aggregation;
      if (!initiated && args.length === 0) {
        aggregation = result.value as never;
        initiated = true;
        continue;
      }
      aggregation = await reducer(aggregation, result.value, index);
      index += 1;
    }
  },
});

export {};
