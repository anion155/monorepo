import { polyfillProperty } from "@anion155/polyfill-base";
import { IteratorPrototype } from "./iterator-prototype";

polyfillProperty(IteratorPrototype, "forEach", {
  value: function forEach<T, TReturn, TNext>(this: Iterator<T, TReturn, TNext>, callback: (value: T, index: number) => void): void {
    let index = 0;
    while (true) {
      const result = this.next();
      if (result.done) return;
      callback(result.value, index);
      index += 1;
    }
  },
});

export {};
