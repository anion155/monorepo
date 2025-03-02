const SuppressedErrorPolyfill = function SuppressedError(error: unknown, suppressed: unknown, message?: string): SuppressedError {
  const parts = [
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    [`[${error}]`, `[${suppressed}]`].join(", "),
  ];
  if (message) parts.unshift(message);
  const instance = Reflect.construct(Error, [parts.join(" ")], new.target || SuppressedErrorPolyfill) as SuppressedError;
  Object.defineProperty(instance, "error", { value: error, writable: true, enumerable: true, configurable: true });
  Object.defineProperty(instance, "suppressed", { value: suppressed, writable: true, enumerable: true, configurable: true });
  return instance;
};
SuppressedErrorPolyfill.prototype = Object.create(Error.prototype, {
  constructor: { value: SuppressedErrorPolyfill, writable: true, enumerable: false, configurable: true },
  name: { value: "SuppressedError", writable: true, enumerable: true, configurable: true },
}) as never;

export const SuppressedError = SuppressedErrorPolyfill as never as SuppressedErrorConstructor;
