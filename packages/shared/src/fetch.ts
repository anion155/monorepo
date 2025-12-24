import { AbortError } from "./abort";
import { isError } from "./is";
import { defineProperty } from "./object";

/**
 * Even though {@link globalThis.fetch} accepts {@link RequestInit.signal} it doesn't respects {@link AbortSignal.reason}.
 * This utility fixes exactly that, it returns {@link Promise.catch} callback that checks if thrown error is
 * {@link AbortError} and throws it's {@link AbortSignal.reason}.
 *
 * @example
 *  declare const signal: AbortSignal;
 *  const response = await fetch('http://domain.test', { signal }).catch(handleAbortedFetch(signal));
 */
export const handleAbortedFetch = (signal?: AbortSignal | null) => (error: unknown) => {
  if (!signal) {
    throw error;
  }
  if (error === signal.reason) {
    throw error;
  }
  if (signal.aborted && isError(error, AbortError)) {
    throw signal.reason;
  }
  throw error;
};

/** {@link globalThis.fetch} wrapper which throws {@link RequestInit.signal}'s {@link AbortSignal.reason} */
export const fetch = (...args: Parameters<typeof globalThis.fetch>) => fetch.original(...args).catch(handleAbortedFetch(args[1]?.signal));
fetch.original = globalThis.fetch;

/** Polyfills {@link globalThis.fetch} with version that throws {@link RequestInit.signal}'s {@link AbortSignal.reason} */
fetch.polyfill = () => {
  if (globalThis.fetch !== fetch) {
    defineProperty(globalThis, "fetch", { value: fetch, writable: true, enumerable: false, configurable: true });
  }
};
