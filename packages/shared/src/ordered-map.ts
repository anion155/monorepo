import { createErrorClass, DeveloperError } from "./errors";

/**
 * OrderedMap maintains insertion order of keys while providing O(1) key lookup.
 *
 * Keys are unique. The map stores values in a Map for fast lookup and an internal
 * array to preserve and manipulate order.
 *
 * @throws {InvalidOrderedMap} If internal state is inconsistent
 *    (key present in order but missing from map and vice versa).
 */
export class OrderedMap<Key, Value> {
  readonly #map = new Map<Key, Value>();
  readonly #order: Key[] = [];

  /** Create a new OrderedMap, optionally initialized from an iterable of entries. */
  constructor(entries?: Iterable<[Key, Value]>) {
    if (entries) {
      for (const [key, value] of entries) {
        this.push(key, value, true);
      }
    }
  }

  /** Number of entries (ordered length). */
  get size() {
    return this.#order.length;
  }
  /** Check whether a key exists. */
  has(key: Key) {
    return this.#map.has(key);
  }

  /** Get the value for a key. */
  get(key: Key): Value | undefined {
    return this.#map.get(key);
  }
  /** Return the key at the given index. */
  keyAt(index: number): Key {
    return this.#order[index];
  }
  /** Return the value at the given index. */
  at(index: number): Value | undefined {
    const key = this.keyAt(index);
    if (key === undefined) return undefined;
    const value = this.#map.get(key);
    if (value === undefined) throw new InvalidOrderedMap();
    return value;
  }

  /**
   * Set the key/value at a specific ordered index.
   * If the key already exists earlier, it is removed and re-inserted at the target index.
   * The previous value at that index (if any) is removed from the map.
   */
  set(index: number, key: Key, value: Value) {
    const had = this.#map.has(key);
    this.#map.set(key, value);
    const prevKey = this.#order[index];
    if (prevKey === key) return;
    if (had) {
      const prevIndex = this.#order.indexOf(key);
      if (prevIndex < 0) throw new InvalidOrderedMap();
      this.#order.splice(prevIndex, 1);
      if (prevIndex < index) index -= 1;
    }
    this.#order[index] = key;
    this.#map.delete(prevKey);
  }

  /** Append a key/value to the end of the map. */
  push(key: Key, value: Value, emplace = false) {
    const had = this.#map.has(key);
    this.#map.set(key, value);
    if (had) {
      if (emplace) return this.#order.length;
      const index = this.#order.indexOf(key);
      if (index < 0) throw new InvalidOrderedMap();
      this.#order.splice(index, 1);
    }
    return this.#order.push(key);
  }
  /** Remove and return the last entry. */
  pop() {
    const key = this.#order.pop();
    if (key === undefined) return undefined;
    const value = this.#map.get(key);
    if (value === undefined) throw new InvalidOrderedMap();
    this.#map.delete(key);
    return [key as Key, value] as const;
  }

  /** Prepend a key/value to the start of the map. */
  unshift(key: Key, value: Value, emplace = false) {
    const had = this.#map.has(key);
    this.#map.set(key, value);
    if (had) {
      if (emplace) return this.#order.length;
      const index = this.#order.indexOf(key);
      if (index < 0) throw new InvalidOrderedMap();
      this.#order.splice(index, 1);
    }
    return this.#order.unshift(key);
  }
  /** Remove and return the first entry. */
  shift() {
    const key = this.#order.shift();
    if (key === undefined) return undefined;
    const value = this.#map.get(key);
    if (value === undefined) throw new InvalidOrderedMap();
    this.#map.delete(key);
    return [key as Key, value] as const;
  }

  /** Delete a key and its value. */
  delete(key: Key) {
    const index = this.#order.indexOf(key);
    if (index < 0) return false;
    this.#order.splice(index, 1);
    this.#map.delete(key);
    return true;
  }
  /** Splice the ordered array: remove and/or insert entries at a given start index {@link Array.prototype.splice}. */
  splice(start: number, deleteCount?: number, ...entries: [Key, Value][]): [Key, Value][] {
    const nextKeys = new Set(entries.map(([key]) => key));
    const prevKeys = this.#order.splice(start, deleteCount ?? this.#order.length - start, ...entries.map(([key]) => key));
    const deletedEntries = prevKeys.map((key) => {
      const value = this.#map.get(key);
      if (value === undefined) throw new InvalidOrderedMap();
      return [key, value] satisfies [Key, Value];
    });
    entries.forEach(([key, value]) => this.#map.set(key, value));
    prevKeys.forEach((key) => nextKeys.has(key) || this.#map.delete(key));
    return deletedEntries;
  }
  /** Remove all entries. */
  clear() {
    this.#order.splice(0);
    this.#map.clear();
  }

  /** Iterate over keys. */
  get keys(): IterableIterator<Key> {
    return this.#order[Symbol.iterator]();
  }
  /** Iterate over entries [key, value]. */
  *[Symbol.iterator](): Generator<[Key, Value]> {
    for (const key of this.#order) {
      const value = this.#map.get(key);
      if (value === undefined) throw new InvalidOrderedMap();
      yield [key, value];
    }
  }
  /** Iterate over entries [key, value]. */
  entries(): IterableIterator<[Key, Value]> {
    return this[Symbol.iterator]();
  }
  /** Iterate over values. */
  values(): IterableIterator<Value> {
    return this[Symbol.iterator]().map(([, value]) => value);
  }
}

export class InvalidOrderedMap extends createErrorClass("InvalidOrderedMap", "OrderedMap is in invalid state", DeveloperError) {}
