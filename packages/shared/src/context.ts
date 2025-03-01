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
  let stack: Context[] = [];

  /** Returns last value put in context stack */
  function current() {
    return stack.length === 0 ? initial : stack[0];
  }
  /** Returns immutable iterator that goes through all stored values in context */
  function* iterator() {
    yield* stack.slice();
    yield initial;
  }
  /** Remove last value pushed to stack, and returns it */
  function pop(): Context;
  function pop(toIndex?: number): Context[];
  function pop(toIndex?: number) {
    if (toIndex === undefined) return stack.shift();
    if (toIndex <= 0) {
      let deleted: Context[] = [];
      [stack, deleted] = [deleted, stack];
      return deleted;
    }
    let deleted: Context[];
    [stack, deleted] = [stack.splice(-toIndex), stack];
    return deleted;
  }
  /** Pushes new value to stack, and return {@link pop} function */
  function push(next: Context) {
    const index = stack.unshift(next) - 1;
    return () => pop(index);
  }
  /** Pushes new value to stack, and returns {@link Disposable} that calls {@link pop} on dispose */
  function setup<Specific extends Context>(next: Specific) {
    const cleanup = push(next);
    const dispose = () => {
      cleanup();
    };
    return create(stack[0] as Specific, { [Symbol.dispose]: dispose });
  }

  return { current, iterator, [Symbol.iterator]: iterator, push, pop, setup };
}
