import { polyfillProperty } from "@anion155/polyfill-base";
import { IteratorPrototype } from "./iterator-prototype";

polyfillProperty(IteratorPrototype, "toArray", {
  value: function toArray<T, TReturn, TNext>(this: Iterator<T, TReturn, TNext>): T[] {
    const items: T[] = [];
    while (true) {
      const result = this.next();
      if (result.done) return items;
      items.push(result.value);
    }
  },
});

export {};
