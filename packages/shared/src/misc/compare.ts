export function compare(a: unknown, b: unknown, deep: number | boolean = true): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object") return false;
  if (a === null || b === null) return false;

  const nextDeep = typeof deep === "number" ? deep - 1 : deep;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0, len = a.length; i < len; i += 1) {
      if (deep) {
        if (!compare(a[i], b[i], nextDeep)) return false;
      } else if (a[i] !== b[i]) return false;
    }
  } else {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    const bKeysSet = new Set(bKeys);
    for (let i = 0, len = aKeys.length; i < len; i += 1) {
      const key = aKeys[i];
      if (!bKeysSet.has(key)) return false;
      bKeysSet.delete(key);
      // @ts-expect-error(7053)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const aProp = a[key];
      // @ts-expect-error(7053)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const bProp = b[key];
      if (deep) {
        if (!compare(aProp, bProp, nextDeep)) return false;
      } else if (aProp !== bProp) return false;
    }
  }

  return true;
}
