export function polyfill(condition: unknown, polyfill: () => void) {
  polyfill();
}

export function polyfillProperty<Value extends object>(value: Value, key: keyof Value | (PropertyKey & {}), descriptor: PropertyDescriptor) {
  const { writable = true, enumerable = true, configurable = true } = descriptor;
  Object.defineProperty(value, key, { ...descriptor, writable, enumerable, configurable });
}
