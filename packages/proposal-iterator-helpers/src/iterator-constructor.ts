import { polyfill, polyfillProperty } from "./base";
import { IteratorPrototype } from "./iterator-prototype";
import { isIteratorInstance } from "./utils";

polyfill("constructor" in IteratorPrototype, () => {
  const IteratorConstructor = function Iterator(this: Iterator<unknown>): Iterator<unknown> {
    if (!isIteratorInstance(this)) throw new TypeError("Constructor Iterator requires 'new'");
    if (Object.getPrototypeOf(this) === IteratorPrototype) throw new TypeError("Abstract class Iterator not directly constructable");
    return this;
  };
  IteratorConstructor.prototype = IteratorPrototype;
  polyfillProperty(IteratorPrototype, "constructor", { value: IteratorConstructor, enumerable: false });
});
export const IteratorConstructor = IteratorPrototype.constructor as never as (abstract new <T, TReturn = unknown, TNext = unknown>() => Iterator<
  T,
  TReturn,
  TNext
>) & {
  from<T, TReturn = unknown, TNext = unknown>(it: Iterator<T, TReturn, TNext> | Iterable<T, TReturn, TNext>): IteratorObject<T, TReturn, TNext>;
};
