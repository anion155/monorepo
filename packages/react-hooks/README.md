# React Hooks and utilities library

This library contains utilities and react hooks.

## API hooks

```ts
import {} from '@anion155/react-hooks';
```

### useConst

```ts
function useConst<T>(fabric: () => T): T;
```

Creates value on the first render, at render time.

```ts
const store = useConst(() => createStore());
```

### useRenderEffect

```ts
type EffectCallback = () => (void | (() => void));
function useRenderEffect(effect: EffectCallback, deps: DependencyList): void;
```

Effect hook that runs at render time.

```ts
const ref = useRef(value);
useRenderEffect(() => {
  ref.current = value;
}, [value]);
// ref.current === value
```

> ### Note
>
> It is not guaranteed that cleanup function would be run during render. Specifically last cleanup before unmount is running as `useEffect` cleanup function.

### useSetStateDispatcher

```ts
type SetStateDispatcher<T> = (state: T | ((current: T) => T)) => void;
function useSetStateDispatcher(get: () => T, set: (value: T) => void, deps: DependencyList): SetStateDispatcher<T>;
```

Creates set state action dispatcher function, which accepts next value or modifier.

```ts
const store = {
  current: null,
  get() { return this.current; },
  set(next) { this.current = next },
};
const dispatcher = useSetStateDispatcher(
  () => store.get(),
  (next) => store.set(next),
  [store]
);
dispatcher(10);
dispatcher(current => current * 2);
```

### useEventState

```ts
function useEventState<T>(stateInitial: StateInitial<T>): [T, (arg: T) => void];
function useEventState<As extends unknown[], T>(
  stateInitial: StateInitial<T>,
  project: (...args: As) => T,
  deps: DependencyList
): [T, (...args: As) => void];
```

Creates event handler that stores event value in state.

```ts
const [value, handleChange] = useEventState('', (event) => event.target.value);
<>
  <input onChange={handleChange} />
  <span>Value: "{value}"</span>
</>
```

### useConstCallback

```ts
function useConstCallback<As extends unknown[], R>(cb: (...args: As) => R): (...args: As) => R;
```

Creates stable callback instance, result function never changes until unmounted.

```ts
const [counter, setCounter] = useState(1);
const cb = useConstCallback(() => {
  setCounter(counter + 1);
});
useEffect(() => {
  console.log('Runs one time only');
}, [cb]);
<button onClick={cb} />
```

## API utils

There is submodule with utility functions

```ts
import {} from '@anion155/react-hooks/utils';
```

### hasOwnProperty

```ts
function hasOwnProperty<P extends string, T>(obj: unknown, propertyName: P): obj is { [p in P]: T };
```

Type safe check if object has own property.

```ts
if (hasOwnProperty(obj, 'field')) {
  obj.field; // ts now knows that obj has property 'field' of unknown type
}
```

### assert

```ts
function assert(condition: unknown, message?: string): asserts condition;
```

Simple assert function.

```ts
assert(hasOwnProperty(obj, 'field'), 'obj does not have property named "field"');
obj.field; // ts now knows that obj has property 'field' of unknown type
```

### warning

```ts
function warning(condition: unknown, message?: string): void;
```

Output warning message to console, falsy condition can be used as a debugger breakpoint if 'pause on all exceptions' enabled in debugger. Does not assert value.

```ts
warning(hasOwnProperty(obj, 'field'), 'obj does not have property named "field"');
obj?.field; // ts now knows that obj has property 'field' of unknown type
```

### cancelablePromise

```ts
class CanceledError extends Error;
type CancelablePromise<T> = Promise<T> & { cancel: () => void };
type CancelState = { canceled: boolean };
type CancelablePromiseExecutor<T> = (
  resolve: (value: T | PromiseLike<T>) => void,
  reject: (reason?: unknown) => void,
  state: Readonly<CancelState>
) => void | { (): void };
function cancelablePromise<T>(executor: CancelablePromiseExecutor<T>): CancelablePromise<T>;
```

Creates cancelable promise.

```ts
const promise = cancelablePromise((resolve, reject, state) => {
  const controller = new AbortController();
  fetch('/something', { signal: controller.signal });
  setTimeout(() => {
    if (!state.canceled) return;
    reject(new Error('Timeout'));
  }, 1000);
  return () => {
    controller.abort();
  };
});
promise.cancel();
```

### asyncDelay

```ts
function asyncDelay(timeout: number): CancelablePromise<void>;
```

Creates cancelable promise that will be resolved with timeout passed.

```ts
await asyncDelay(1000);
```

### compareProps

```ts
function compareProps(prev: DependencyList, next: DependencyList): boolean;
```

Compares two dependencies arrays, return true if they are equal.

```ts
compareProps(["same", 1], ["same", 2]) === 2;
```

