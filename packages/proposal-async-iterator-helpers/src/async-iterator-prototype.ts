import { polyfillProperty } from "@anion155/polyfill-base";

/* istanbul ignore next */
async function* anonym() {}
export const AsyncIteratorPrototype = Object.getPrototypeOf(Object.getPrototypeOf(Object.getPrototypeOf(anonym()))) as AsyncIterator<unknown>;

polyfillProperty(AsyncIteratorPrototype, Symbol.toStringTag, {
  value: "AsyncIterator",
  writable: false,
  enumerable: false,
});
polyfillProperty(AsyncIteratorPrototype, Symbol.iterator, {
  value: function iterator() {
    return this;
  },
});
