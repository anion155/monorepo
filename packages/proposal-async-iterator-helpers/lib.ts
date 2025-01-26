declare global {
  interface Iterator<T, TReturn, TNext> {
    toAsync(): AsyncIteratorObject<T, TReturn, TNext>;
  }
  interface AsyncIteratorObject<T, TReturn, TNext> {
    readonly [Symbol.toStringTag]: string;
    drop(limit: number): AsyncGenerator<T, TReturn, TNext>;
    every(predicate: (value: T, index: number) => boolean | Promise<boolean>): Promise<boolean>;
    filter(predicate: (value: T, index: number) => boolean | Promise<boolean>): AsyncGenerator<T, TReturn, TNext>;
    find(predicate: (value: T, index: number) => boolean | Promise<boolean>): Promise<T | undefined>;
    flatMap<U>(project: (value: T, index: number) => AsyncIterator<U> | AsyncIterable<U> | Iterable<U>): AsyncGenerator<U, TReturn, undefined>;
    forEach(callback: (value: T, index: number) => void | Promise<void>): Promise<void>;
    map<U>(project: (value: T, index: number) => U | Promise<U>): AsyncGenerator<U, TReturn, TNext>;
    reduce(reducer: (aggregation: T, value: T, index: number) => T | Promise<T>): Promise<T>;
    reduce<U>(reducer: (aggregation: U, value: T, index: number) => U | Promise<U>, initialValue: U): Promise<U>;
    some(predicate: (value: T, index: number) => boolean | Promise<boolean>): Promise<boolean>;
    take(limit: number): AsyncGenerator<T, TReturn, TNext>;
    toArray(): Promise<T[]>;
  }
  interface AsyncIteratorConstructor {
    new <T, TReturn = unknown, TNext = unknown>(): AsyncIterator<T, TReturn, TNext>;
    (): never;
    from<T, TReturn = unknown, TNext = unknown>(
      it: Iterator<T, TReturn, TNext> | Iterable<T> | AsyncIterator<T, TReturn, TNext> | AsyncIterable<T>,
    ): AsyncIteratorObject<T, TReturn, TNext>;
  }
  // eslint-disable-next-line no-var -- declaring globally
  var AsyncIterator: AsyncIteratorConstructor;
}

export {};
