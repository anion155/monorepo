const invalidate = Symbol.for("Signal#invalidate");
declare global {
  interface SymbolConstructor {
    invalidate: typeof invalidate;
  }
}
Symbol.invalidate = invalidate;
