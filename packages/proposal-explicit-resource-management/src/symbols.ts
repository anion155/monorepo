import { polyfillProperty } from "./base";

declare global {
  interface Symbol {
    readonly dispose: unique symbol;
    readonly asyncDispose: unique symbol;
  }
}

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
