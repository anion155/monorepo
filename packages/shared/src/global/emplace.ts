import { defineMethod } from "../object";

declare global {
  interface Map<K, V> {
    /**
     * Given a {@link key} and a {@link fabric} function, the `emplace` method
     * will return the existing value if it exists, or otherwise insert the
     * returned value of the {@link fabric} function, and return that value.
     */
    emplace(key: K, fabric: (key: K) => V): V;
    /**
     * Creates new Map, with same entries and default fabric for emplace method.
     */
    withFabric(fabric: (key: K) => V): MapWithFabric<K, V>;
  }
  interface MapWithFabric<K, V> extends Omit<Map<K, V>, "emplace" | "withFabric"> {
    /**
     * Given a {@link key} the `emplace` method will return the existing value if it exists,
     * or otherwise insert the returned value of the {@link fabric} function, and return that value.
     */
    emplace(key: K): V;
  }
  interface MapConstructor {
    /**
     * Creates Map with default fabric for emplace method.
     */
    withFabric<K, V>(fabric: (key: K) => V, iterable?: Iterable<readonly [K, V]> | null): MapWithFabric<K, V>;
  }
}
defineMethod(Map.prototype, "emplace", function emplace(key: unknown, fabric: (key: unknown) => unknown) {
  /* eslint-disable @typescript-eslint/no-unsafe-return */
  if (!this.has(key)) this.set(key, fabric(key));
  return this.get(key)!;
  /* eslint-enable @typescript-eslint/no-unsafe-return */
});
defineMethod(Map, "withFabric", function withFabric(fabric, iterable) {
  return Object.assign(new Map(iterable), {
    withFabric: undefined,
    emplace: function emplace(this: Map<unknown, unknown>, key: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return Map.prototype.emplace.call(this, key, fabric);
    },
  });
});
defineMethod(Map.prototype, "withFabric", function withFabric(fabric: (key: unknown) => unknown) {
  return Map.withFabric(fabric, this.entries());
});

declare global {
  interface WeakMap<K extends WeakKey, V> {
    /**
     * Given a {@link key} and a {@link fabric} function, the `emplace` method
     * will return the existing value if it exists, or otherwise insert the
     * returned value of the {@link fabric} function, and return that value.
     */
    emplace(key: K, fabric: (key: K) => V): V;
    /**
     * Creates new WeakMap without entries and emplace method with known fabric.
     */
    withFabric(fabric: (key: K) => V, keys?: Iterable<K>): WeakMapWithFabric<K, V>;
  }
  interface WeakMapWithFabric<K extends WeakKey, V> extends Omit<WeakMap<K, V>, "emplace" | "withFabric"> {
    /**
     * Given a {@link key} the `emplace` method will return the existing value if it exists,
     * or otherwise insert the returned value of the {@link fabric} function, and return that value.
     */
    emplace(key: K): V;
  }
  interface WeakMapConstructor {
    /**
     * Creates WeakMap with default fabric for emplace method.
     */
    withFabric<K extends WeakKey, V>(fabric: (key: K) => V, iterable?: Iterable<readonly [K, V]>): WeakMapWithFabric<K, V>;
  }
}
defineMethod(WeakMap.prototype, "emplace", function emplace(key: WeakKey, fabric: (key: WeakKey) => unknown) {
  /* eslint-disable @typescript-eslint/no-unsafe-return */
  if (!this.has(key)) this.set(key, fabric(key));
  return this.get(key)!;
  /* eslint-enable @typescript-eslint/no-unsafe-return */
});
defineMethod(WeakMap, "withFabric", function withFabric(fabric, iterable) {
  return Object.assign(new WeakMap(iterable as never), {
    withFabric: undefined,
    emplace: function emplace(this: WeakMap<WeakKey, unknown>, key: WeakKey) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return WeakMap.prototype.emplace.call(this, key, fabric);
    },
  });
});
defineMethod(WeakMap.prototype, "withFabric", function withFabric(fabric: (key: WeakKey) => unknown, keys) {
  return Object.assign(
    new WeakMap(
      keys
        ? Iterator.from(keys)
            .map((key) => [key, this.get(key)!] as const)
            .toArray()
        : undefined,
    ),
    {
      withFabric: undefined,
      emplace: function emplace(this: Map<unknown, unknown>, key: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return Map.prototype.emplace.call(this, key, fabric);
      },
    },
  );
});

export class SmartWeakRef<V extends WeakKey> {
  #ref: WeakRef<{ value: V }>;
  constructor(readonly fabric: () => V) {
    this.#ref = new WeakRef({ value: fabric() });
  }

  deref() {
    return this.#ref.deref()?.value;
  }
  emplace() {
    const stored = this.#ref.deref();
    if (stored) return stored.value;
    this.#ref = new WeakRef({ value: this.fabric() });
    return this.#ref.deref()!.value;
  }
}

export {};
