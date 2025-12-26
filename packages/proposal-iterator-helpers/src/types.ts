interface Iterator<T, TResult, TNext> extends globalThis.IteratorObject<T, TResult, TNext> {}
declare abstract class Iterator<T, TResult = undefined, TNext = unknown> {
  abstract next(value?: TNext): IteratorResult<T, TResult>;
}
type IteratorObjectConstructor = typeof Iterator;
declare global {
  interface IteratorObject<T, TReturn, TNext> {
    readonly [Symbol.toStringTag]: string;
    [Symbol.iterator](): IteratorObject<T, TReturn, TNext>;
    drop(limit: number): Generator<T, TReturn, TNext>;
    every(predicate: (value: T, index: number) => boolean): boolean;
    filter(predicate: (value: T, index: number) => boolean): Generator<T, TReturn, TNext>;
    find(predicate: (value: T, index: number) => boolean): T | undefined;
    flatMap<U>(project: (value: T, index: number) => Iterator<U> | Iterable<U>): Generator<U, TReturn, undefined>;
    forEach(callback: (value: T, index: number) => void): void;
    map<U>(project: (value: T, index: number) => U): Generator<U, TReturn, TNext>;
    reduce<U>(reducer: (aggregation: U, value: T, index: number) => U, ...args: [initialValue?: U]): U;
    some(predicate: (value: T, index: number) => boolean): boolean;
    take(limit: number): Generator<T, T | TReturn | undefined, TNext>;
    toArray(): T[];
  }
  interface IteratorConstructor extends IteratorObjectConstructor {
    from<T, TReturn = unknown, TNext = undefined>(it: Iterator<T, TReturn, TNext> | Iterable<T, TReturn, TNext>): IteratorObject<T, TReturn, TNext>;
  }
  var Iterator: IteratorConstructor;
}

export {};
