import { IteratorPrototype } from "./iterator-prototype";
import { polyfillProperty } from "./polyfill";

polyfillProperty(IteratorPrototype, "flatMap", {
  value: function* flatMap<T, TReturn, TNext, U>(
    this: Iterator<T, TReturn, TNext>,
    project: (value: T, index: number) => Iterator<U> | Iterable<U>,
  ): Generator<U, TReturn, undefined> {
    let index = 0;
    while (true) {
      const result = this.next();
      if (result.done) return result.value;
      yield* Iterator.from(project(result.value, index));
      index += 1;
    }
  },
});

export {};
