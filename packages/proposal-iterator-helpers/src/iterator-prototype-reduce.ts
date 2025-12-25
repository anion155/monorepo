import { polyfillProperty } from "./base";
import { IteratorPrototype } from "./iterator-prototype";

polyfillProperty(IteratorPrototype, "reduce", {
  value: function reduce<T, TReturn, TNext, U>(
    this: Iterator<T, TReturn, TNext>,
    reducer: (aggregation: U, value: T, index: number) => U,
    ...args: [initialValue?: U]
  ): U {
    let index = 0;
    let aggregation: U = args[0] as never;
    let initiated = args.length > 0;
    while (true) {
      const result = this.next();
      if (result.done) return aggregation;
      if (!initiated && args.length === 0) {
        aggregation = result.value as never;
        initiated = true;
        continue;
      }
      aggregation = reducer(aggregation, result.value, index);
      index += 1;
    }
  },
});

export {};
