import { polyfillProperty } from "./base";

export const IteratorPrototype = Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]())) as Iterator<unknown>;

polyfillProperty(IteratorPrototype, Symbol.toStringTag, {
  value: "Iterator",
  writable: false,
  enumerable: false,
});
polyfillProperty(IteratorPrototype, Symbol.iterator, {
  value: function iterator() {
    return this;
  },
});
