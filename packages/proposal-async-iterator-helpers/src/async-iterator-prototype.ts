import { polyfillProperty } from "./base";

/* istanbul ignore next */
async function* anonym() {}
export const AsyncIteratorPrototype = Object.getPrototypeOf(Object.getPrototypeOf(Object.getPrototypeOf(anonym()))) as AsyncIterator<unknown>;

polyfillProperty(AsyncIteratorPrototype, Symbol.toStringTag, {
  value: "AsyncIterator",
  writable: false,
  enumerable: false,
});
