import { polyfillProperty } from "./base";
import { DisposableStack } from "./disposable-stack";

polyfillProperty(globalThis, "DisposableStack", {
  value: DisposableStack,
});

export {};
