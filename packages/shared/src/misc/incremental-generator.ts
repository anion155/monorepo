/** Incremental safe integer generator */
export function incrementGenerator() {
  return {
    current: 0,
    next() {
      this.current += 1;
      if (!Number.isSafeInteger(this.current)) this.current = 0;
      return { value: this.current };
    },
    return() {
      Object.defineProperties(this, {
        last: { value: 0, writable: false },
        next: { value: () => ({ done: true }), writable: false },
      });
      return { value: undefined, done: true };
    },
  } as Iterator<number> & { current: number } as Iterator<number> & { readonly current: number };
}
