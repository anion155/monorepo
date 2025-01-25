export function polyfill(condition: unknown, polyfill: () => void) {
  if (!condition) polyfill();
}

export function polyfillProperty<Value extends object>(value: Value, key: keyof Value | (PropertyKey & {}), descriptor: PropertyDescriptor) {
  if (!(key in value)) {
    const { writable = true, enumerable = true, configurable = true } = descriptor;
    Object.defineProperty(value, key, { ...descriptor, writable, enumerable, configurable });
  }
}
