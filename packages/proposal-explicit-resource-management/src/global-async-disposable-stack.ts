import { polyfillProperty } from "@anion155/polyfill-base";

import { AsyncDisposableStack } from "./async-disposable-stack";

polyfillProperty(globalThis, "AsyncDisposableStack", {
  value: AsyncDisposableStack,
});

export {};
