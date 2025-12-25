import { AsyncDisposableStack } from "./async-disposable-stack";
import { polyfillProperty } from "./base";

polyfillProperty(globalThis, "AsyncDisposableStack", {
  value: AsyncDisposableStack,
});

export {};
