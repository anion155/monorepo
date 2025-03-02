import "./global-symbols";

import { polyfillProperty } from "@anion155/polyfill-base";

import { AsyncIteratorPrototype } from "./utils";

polyfillProperty(AsyncIteratorPrototype, Symbol.asyncDispose, {
  value: async function dispose<T, TReturn, TNext>(this: AsyncIterator<T, TReturn, TNext>): Promise<void> {
    await this.return?.();
  },
});

export {};
