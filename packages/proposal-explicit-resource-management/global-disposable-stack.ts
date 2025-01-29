import { polyfillProperty } from "@anion155/polyfill-base";

import { DisposableStack } from "./disposable-stack";

polyfillProperty(globalThis, "DisposableStack", {
  value: DisposableStack,
});

export {};
