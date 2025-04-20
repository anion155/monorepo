import { DeveloperError } from "../errors";
import { noop, reduce } from "../functional";
import { is } from "../is";
import { isIterable } from "../is-iterable";

function shallowCompare(a: unknown, b: unknown) {
  return a === b;
}

function compareUnorderedEntries(a: [unknown, unknown][], b: [unknown, unknown][], compareValues: (a: unknown, b: unknown) => boolean) {
  if (a.length !== b.length) return false;
  const bMap = new Map(b);
  for (let i = 0, len = a.length; i < len; i += 1) {
    const [key, aValue] = a[i];
    if (!bMap.has(key)) return false;
    const bValue = bMap.get(key)!;
    bMap.delete(key);
    if (!compareValues(aValue, bValue)) return false;
  }
  return bMap.size === 0;
}

const compareByType = [
  [
    Array.isArray,
    function compareArrays(a: unknown[], b: unknown[], nextCompare) {
      if (a.length !== b.length) return false;
      return a.every((aValue, index) => nextCompare(aValue, b[index]));
    },
  ],
  [
    is.create(Map),
    function compareMaps(a: Map<unknown, unknown>, b: Map<unknown, unknown>, nextCompare) {
      return compareUnorderedEntries(a.entries().toArray(), b.entries().toArray(), nextCompare);
    },
  ],
  [
    is.create(Set),
    function compareSets(a: Set<unknown>, b: Set<unknown>, nextCompare) {
      if (a.size !== b.size) return false;
      return a.values().every((aValue) => {
        if (b.has(aValue)) return true;
        if (nextCompare === shallowCompare) return false;
        if (b.values().every((bValue) => !nextCompare(aValue, bValue))) return false;
        return true;
      });
    },
  ],
  [
    (value) => {
      if (is(value, WeakMap) || is(value, WeakSet)) throw new DeveloperError("can't compare weak storages");
    },
    noop,
  ],
  [
    (value) => {
      if (!isIterable(value)) return false;
      return reduce(
        value,
        (entries, maybeEntry, index, reduced) => {
          if (!Array.isArray(maybeEntry) || maybeEntry.length !== 2) return reduced(false as never);
          entries.push(maybeEntry as never);
          return entries;
        },
        [] as [unknown, unknown][],
      );
    },
    function compareEntriesIterables(aIter, bIter, nextCompare, [a, b]: [[unknown, unknown][], [unknown, unknown][]]) {
      if (a.length !== b.length) return false;
      for (let i = 0, len = a.length; i < len; i += 1) {
        const [aKey, aValue] = a[i];
        const [bKey, bValue] = b[i];
        if (aKey !== bKey) return false;
        if (!nextCompare(aValue, bValue)) return false;
      }
      return true;
    },
  ],
  [
    (value) => isIterable(value) && value[Symbol.iterator](),
    function compareIterables(aValue, bValue, nextCompare, [a, b]: [Iterator<unknown>, Iterator<unknown>]) {
      let aResult = a.next();
      let bResult = b.next();
      while (!aResult.done) {
        if (bResult.done) return false;
        if (!nextCompare(aResult.value, bResult.value)) return false;
        aResult = a.next();
        bResult = b.next();
      }
      if (!bResult.done) return false;
      return true;
    },
  ],
] as [
  isType: (value: object) => unknown,
  compare: (a: object, b: object, nextCompare: (a: unknown, b: unknown) => boolean, isTypeResult: [unknown, unknown]) => boolean,
][];

/**
 * Implements deep values comparison.
 * If {@link deep} param is number - will compare objects for this number of layers
 * if {@link deep} is Infinity, negative, or true - will compare objects as deep as possible (do not use with cyclic objects)
 * if {@link deep} is false - will do shallow comparison
 */
export function compare(a: unknown, b: unknown, deep: number | boolean = true): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object") return false;
  if (a === null || b === null) return false;
  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;

  const nextCompare: (a: unknown, b: unknown) => boolean = deep
    ? (a, b) => compare(a, b, typeof deep === "number" ? deep - 1 : true)
    : shallowCompare;

  for (const [isType, typeEqual] of compareByType) {
    const result = [isType(a), isType(b)] as [unknown, unknown];
    if (!result[0]) {
      if (!result[1]) continue;
      return false;
    }
    if (!result[1]) return false;
    return typeEqual(a, b, nextCompare, result);
  }
  return compareUnorderedEntries(Object.entries(a), Object.entries(b), nextCompare);
}
