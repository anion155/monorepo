import { jest } from "@jest/globals";

export const runIsolated = <Value>(fn: (stack: DisposableStack) => Value) => {
  const stack = new DisposableStack();
  let value!: Value;
  jest.isolateModules(() => {
    value = fn(stack);
  });
  return { value, [Symbol.dispose]: () => stack.dispose() };
};
