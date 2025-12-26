import { polyfillProperty } from "./base";
import { IteratorConstructor } from "./iterator-constructor";
import { IteratorPrototype } from "./iterator-prototype";
import { isIterable, isIteratorInstance } from "./utils";

const doneKey = Symbol.for("proxy-iterator-done");
const targetKey = Symbol.for("proxy-iterator-target");

type ProxyIterator<T, TReturn = unknown, TNext = unknown> = Iterator<T, TReturn, TNext> & {
  [doneKey]: boolean;
  readonly [targetKey]: Iterator<T, TReturn, TNext>;
};

function ProxyIterator<T, TReturn = unknown, TNext = unknown>(this: ProxyIterator<T, TReturn, TNext>, target: Iterator<T, TReturn, TNext>) {
  this[doneKey] = false;
  polyfillProperty(this, targetKey, { value: target, writable: false });
}
ProxyIterator.prototype = Object.create(IteratorPrototype, {
  next: {
    value: function proxyNext(this: ProxyIterator<unknown, unknown, unknown>, value: unknown) {
      if (this[doneKey]) return { done: true, value: undefined };
      return this[targetKey].next(value);
    },
  },
  return: {
    value: function proxyReturn(this: ProxyIterator<unknown, unknown, unknown>, value?: unknown) {
      this[doneKey] = true;
      if (!this[targetKey].return) return { value, done: true };
      return this[targetKey].return?.(value);
    },
  },
  throw: {
    value: function proxyThrow(this: ProxyIterator<unknown, unknown, unknown>, error?: unknown) {
      this[doneKey] = true;
      if (!this[targetKey].throw) throw error;
      return this[targetKey].throw(error);
    },
  },
}) as ProxyIterator<unknown, unknown, unknown>;

polyfillProperty(IteratorConstructor, "from", {
  value: function from<T, TReturn = unknown, TNext = undefined>(
    it: Iterator<T, TReturn, TNext> | Iterable<T, TReturn, TNext>,
  ): IteratorObject<T, TReturn, TNext> {
    if (isIteratorInstance<T, TReturn, TNext>(it)) return it;
    const iterator = isIterable(it) ? it[Symbol.iterator]() : it;
    if (isIteratorInstance<T, TReturn, TNext>(iterator)) return iterator;
    return Reflect.construct(ProxyIterator, [iterator]) as never;
  },
});

export {};
