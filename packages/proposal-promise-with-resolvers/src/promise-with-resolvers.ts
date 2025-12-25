import { polyfillProperty } from "./base";

polyfillProperty(Promise, "withResolvers", {
  value: function withResolvers<T>(this: typeof Promise) {
    const deferred: {
      promise: Promise<T>;
      resolve: (value: T | PromiseLike<T>) => void;
      reject: (reason?: unknown) => void;
    } = {} as never;
    deferred.promise = new Promise<T>((resolve, reject) => {
      deferred.resolve = resolve;
      deferred.reject = reject;
    });
    return deferred;
  },
});
