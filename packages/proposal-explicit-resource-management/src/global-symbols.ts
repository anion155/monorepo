import { polyfillProperty } from "@anion155/polyfill-base";

polyfillProperty(Symbol, "dispose", {
  value: Symbol("Symbol.dispose"),
  writable: false,
  enumerable: false,
  configurable: false,
});
polyfillProperty(Symbol, "asyncDispose", {
  value: Symbol("Symbol.asyncDispose"),
  writable: false,
  enumerable: false,
  configurable: false,
});

export {};
