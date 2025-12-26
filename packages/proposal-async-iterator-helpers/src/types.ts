interface AsyncIterator<T, TResult, TNext> extends globalThis.AsyncIteratorObject<T, TResult, TNext> {}
declare abstract class AsyncIterator<T, TResult = undefined, TNext = unknown> {
  abstract next(value?: TNext): Promise<IteratorResult<T, TResult>>;
}
type AsyncIteratorObjectConstructor = typeof AsyncIterator;

declare global {
  interface AsyncIteratorObject<T, TReturn, TNext> {
    readonly [Symbol.toStringTag]: string;
    drop(limit: number): AsyncGenerator<T, TReturn, TNext>;
    every(predicate: (value: T, index: number) => boolean | Promise<boolean>): Promise<boolean>;
    filter(predicate: (value: T, index: number) => boolean | Promise<boolean>): AsyncGenerator<T, TReturn, TNext>;
    find(predicate: (value: T, index: number) => boolean | Promise<boolean>): Promise<T | undefined>;
    flatMap<U>(project: (value: T, index: number) => AsyncIterator<U> | AsyncIterable<U> | Iterable<U>): AsyncGenerator<U, TReturn, undefined>;
    forEach(callback: (value: T, index: number) => void | Promise<void>): Promise<void>;
    map<U>(project: (value: T, index: number) => U | Promise<U>): AsyncGenerator<U, TReturn, TNext>;
    reduce<U>(reducer: (aggregation: U, value: T, index: number) => U | Promise<U>, ...args: [initialValue: U] | []): Promise<U>;
    some(predicate: (value: T, index: number) => boolean | Promise<boolean>): Promise<boolean>;
    take(limit: number): AsyncGenerator<T, T | TReturn | undefined, TNext>;
    toArray(): Promise<T[]>;
  }
  interface IteratorObject<T, TReturn, TNext> {
    toAsync(): AsyncGenerator<T, TReturn, TNext>;
  }
  interface AsyncIteratorConstructor extends AsyncIteratorObjectConstructor {
    from<T, TReturn = unknown, TNext = undefined>(
      it: Iterator<T, TReturn, TNext> | Iterable<T, TReturn, TNext> | AsyncIterator<T, TReturn, TNext> | AsyncIterable<T, TReturn, TNext>,
    ): AsyncIteratorObject<T, TReturn, TNext>;
  }
  var AsyncIterator: AsyncIteratorConstructor;
}

export {};
