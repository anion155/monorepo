import { create } from "./object";

/**
 * Utility to create context stack
 *
 * @example
 * const store = new Set();
 * const context = createContextStack({ type: 'none' })
 * function handleValue(value) {
 *   switch(context.current().type) {
 *     case 'none': return;
 *     case 'store':
 *       store.add(value);
 *       break;
 *     case 'remove':
 *       store.delete(value);
 *       break;
 *   }
 * }
 * handleValue(5); // store => []
 * context.push({ type: 'store' });
 * handleValue(5); // store => [5]
 * context.pop();
 * handleValue(6); // store => [5]
 * context.push({ type: 'remove' });
 * handleValue(5); // store => []
 */
export function createContextStack<Context extends object>(initial: Context) {
  type Cleanup = { (): void } | void;
  let stack: [Context, Cleanup][] = [];

  function clean(item: [Context, Cleanup] | undefined) {
    item?.[1]?.();
    return item?.[0];
  }

  /** Returns last value put in context stack */
  function current() {
    return stack.length === 0 ? initial : stack[0][0];
  }
  /** Returns immutable iterator that goes through all stored values in context */
  function* iterator() {
    for (const item of stack.slice()) {
      yield item[0];
    }
    yield initial;
  }
  /** Finds first item in stack that fits predicator */
  function find<Fn extends Predicate<Context, Context>>(predicate: Fn): InferPredicate<Fn>["Result"] | undefined {
    for (const item of stack.slice()) {
      if (predicate(item[0])) return item[0];
    }
    return undefined;
  }
  /** Pushes new value to stack, and return {@link pop} function */
  function push(next: Context, cleanup?: Cleanup) {
    const index = stack.unshift([next, cleanup]) - 1;
    return () => pop(index);
  }
  /** Remove last value pushed to stack, and returns it */
  function pop(): Context;
  function pop(toIndex?: number): Context[];
  function pop(toIndex?: number) {
    if (toIndex === undefined) return clean(stack.shift());
    if (toIndex <= 0) {
      let deleted: [Context, Cleanup][] = [];
      [stack, deleted] = [deleted, stack];
      return deleted.map(clean);
    }
    let deleted: [Context, Cleanup][];
    [stack, deleted] = [stack.splice(-toIndex), stack];
    return deleted.map(clean);
  }
  /** Pushes new value to stack, and returns {@link Disposable} that calls {@link pop} on dispose */
  function setup<Specific extends Context>(next: Specific, cleanup?: Cleanup) {
    const popToCurrent = push(next, cleanup);
    const dispose = () => {
      popToCurrent();
    };
    return create(next, { [Symbol.dispose]: dispose });
  }

  return { current, iterator, [Symbol.iterator]: iterator, find, push, pop, setup };
}
export type ContextStack<Context extends object> = ReturnType<typeof createContextStack<Context>>;
export type InferContextStack<_ContextStack> = _ContextStack extends ContextStack<infer Context> ? Context : never;
