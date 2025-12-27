import { polyfillProperty } from "./base";

export type PromiseWithResolvers<T> = {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
};

polyfillProperty(Promise, "withResolvers", {
  value: function withResolvers<T>(this: typeof Promise): PromiseWithResolvers<T> {
    const deferred = {} as PromiseWithResolvers<T>;
    deferred.promise = new Promise<T>((resolve, reject) => {
      deferred.resolve = resolve;
      deferred.reject = reject;
    });
    return deferred;
  },
});
