# React Reactive Hooks and utilities library

This library contains utilities and react hooks related to work with rxjs.

## API hooks

```ts
import {} from '@anion155/react-rxjs-hooks';
```

### useRxSubscription

```ts
function useRxSubscription(
  fabric: () => Subscription | ObservableInput<unknown>,
  deps: DependencyList
): void
```

Create and manage subscription to source observable.

```ts
const time = 1000;
useRxSubscription(() => interval(time).pipe(
  tap(() => console.log('effect like behavior'))
), [time]);
```

Or with observer:

```ts
const store = new BehaviorSubject(undefined);
useRxSubscription(() => interval(1000), [], () => store, [store]);
// source.next -> undefined, 0, 1, 2, 3, ...
```

### useRxStore

```ts
function useRxStore<T>(initial: ReactRxStoreInput<T>): ReactRxStore<T>;
```

Create and controls instance of [`ReactRxStore`](#reactrxstore) with lifecycle, unless store was passed as initial parameter.

```ts
const store = useRxStore('value');
```

> ### Note
>
> 'Create and controls instance of [`ReactRxStore`](#reactrxstore) with lifecycle'
> means that on unmount instance of [`ReactRxStore`](#reactrxstore) would be completed.

### useRxStoreValue

```ts
function useRxStoreValue<T>(store: ReactRxStore<T>): T;
```

Subscribe to store and return it's value.

```ts
const store = useRxStore('value');
const value = useRxStoreValue(store); // will re-render on next value
store.next('next value');
```

### useRxStoreDispatcher

```ts
type SetStateDispatcher<T> = (state: T | ((current: T) => T)) => void;
function useRxStoreDispatcher<T>(store: ReactRxStore<T>): SetStateDispatcher<T>;
```

Create `SetStateDispatcher<T>` that dispatch next value to instance of [`ReactRxStore`](#reactrxstore).

```ts
const store = useRxStore('value');
const value = useRxStoreValue(store);
const setValue = useRxStoreDispatcher(store);
setValue(value => `previous was: ${value}`);
```

### useRxState

[ReactRxStoreInput](#reactrxstore)

```ts
function useRxState<T>(storeInitial: ReactRxStoreInput<T>): [value: T, dispatcher: SetStateDispatcher<T>, store: ReactRxStore<T>];
```

Create and controls instance of [`ReactRxStore`](#reactrxstore) with lifecycle, unless store was passed as initial parameter.

And with this `store` create `useState`-like tuple:

- value subscribed to instance of [`ReactRxStore`](#reactrxstore),
- `SetStateDispatcher<T>` that dispatch next to to instance of [`ReactRxStore`](#reactrxstore),
- and instance of [`ReactRxStore`](#reactrxstore) it self.

```ts
const [value, setValue, store] = useRxState('value');
setValue(value => `previous was: ${value}`);
```

Or with provided store:

```ts
const store: BehaviorSubject<string>;

const [value, setValue] = useRxState(store);
setValue(value => `previous was: ${value}`);
```

### useRxStoreObservableFiller

```ts
function useRxStoreObservableFiller<T>(
  sourceFabric: () => ObservableInput<T>,
  deps: DependencyList,
  storeInitial?: ReactRxStoreInput<T | undefined>
): ReactRxStore<T | undefined>;
```

Store observable values in rx store.

```ts
const store = useRxStoreObservableFiller(() => of(5), []);
```

### useRxValue

```ts
function useRxValue<T>(sourceFabric: () => BehaviorSubject<T>, deps: DependencyList): T;
function useRxValue<T>(sourceFabric: () => ObservableInput<T>, deps: DependencyList): T | undefined;
```

Subscribe and return value of `Observable`.

```ts
const value: number | undefined = useRxValue(() => of(5).pipe(delay(100)), []);

const value: number | undefined = useRxValue(() => of(5), []);
assert(value, 'value would be equal to \'5\' right away, but typescript can\'t know this for sure');

const value: number = useRxValue(() => new BehaviorSubject(5), []);
```

### useRxEventStore

[ReactRxStoreInput](#reactrxstore)

```ts
function useRxEventStore<T>(storeInitial: ReactRxStoreInput<T>): [ReactRxStore<T>, (arg: T) => void];
function useRxEventStore<As extends unknown[], T>(
  storeInitial: ReactRxStoreInput<T>,
  project: (...args: As) => T,
  deps: DependencyList
): [ReactRxStore<T>, (...args: As) => void];
```

Creates event handler that stores event value to instance of [`ReactRxStore`](#reactrxstore).

```ts
const [store, handleChange] = useRxEventStore('', (event) => event.target.value);
<input onChange={handleChange} />
```

Or with provided store:

```ts
const store: BehaviorSubject<string>;

const [, handleChange] = useRxEventStore(store, (event) => event.target.value);
<input onChange={handleChange} />
```

### useRxCallback

[`PromiseSubscriber`](#topromise)

[`EmptyValueError`](#emptyvalueerror)

```ts
function useRxCallback<As extends unknown[], T>(
  sourceFabric: (...args: As) => ObservableInput<T>,
  deps: DependencyList
): (...args: As) => PromiseSubscribed<T | undefined>;
function useRxCallback<As extends unknown[], T, U>(
  sourceFabric: (...args: As) => ObservableInput<T>,
  deps: DependencyList,
  subscriber: PromiseSubscriber<T, U>
): (...args: As) => PromiseSubscribed<U>;
```

Creates callback that would create and subscribe to `Observable` returned by `sourceFabric` and return `Promise` with resolved value. Can accept `subscriber` function that can control result of `Promise`.

Hoist subscribers of [`toPromise`](#topromise).

Without `subsciber` would create in lifecycle equivalent of `useRxCallback.throttle(useRxCallback.withInitial(undefined, useRxCallback.last<T>()))`. It means that each call of resulted callback would return last provided value on completion of `Observable`, would return `undefined` if value was not provided before completion, and would unsubscribe from `Observable` created on previous call.

```ts
const cb = useRxCallback((count: number) => fromFetch(`https://api.github.com/users?per_page=${count}`), []);

cb(5); // fetch would be canceled, because of next call, and return undefined
const result = await cb(6);
```

## API utils

```ts
import {} from '@anion155/react-rxjs-hooks/utils';
```

### EmptyValueError

```ts
class EmptyValueError extends Error;
```

Specific type of `Error`.

### getImmediate

```ts
function getImmediate<T>(source: Observable<T>): { value: T } | { error: unknown } | undefined;
```

Get immediate value from `Observable`.

```ts
getImmediate(of(5)); // { value: 5 }

getImmediate(throwError(() => 5)); // { error: 5 }

const subject = new Subject();
subject.complete();
getImmediate(subject); // { error: EmptyValueError }

const subject = new Subject();
getImmediate(subject); // undefined
```

### ReactRxStore

```ts
interface ReactRxStore<T> extends BehaviorSubject<T> {
  reactSubscription: (onStoreChange: () => void) => () => void;
}
```

Store subject with alternative subscription method `reactSubscription`.

### createReactRxStore

```ts
type ReactRxStoreInput<T> =
  | T
  | { (): T }
  | BehaviorSubject<T>
  | { (): BehaviorSubject<T> };
function createReactRxStore<T>(input: ReactRxStoreInput<T>): ReactRxStore<T>;
```

Creates `BehaviorSubject` from value (unless not completed instance was provided), use it as prototype (unless it is `ReactRxStore` already), add `reactSubscription` implementation.

```ts
const store = createReactRxStore('value');
const store = createReactRxStore(() => 'value');

// provided subject is used as prototype
const store = createReactRxStore(new BehaviorSubject('value'));
const store = createReactRxStore(() => new BehaviorSubject('value'));

const completedSubject = new BehaviorSubject('value');
completedSubject.complete();
// only value of subject used
const store = createReactRxStore(completedSubject);
const store = createReactRxStore(() => completedSubject);

const sourceStore = createReactRxStore('value');
// same as sourceStore
const store = createReactRxStore(sourceStore);
const store = createReactRxStore(() => sourceStore);
```

### isReactRxStore

```ts
function isReactRxStore<T>(subject: BehaviorSubject<T>): subject is ReactRxStore<T>;
```

Checks if `subject` is `ReactRxStore`.

```ts
isReactRxStore(new BehaviorSubject(5)); // false
isReactRxStore(createReactRxStore(5)); // true
```

### isImmediateCompleted

```ts
function isImmediateCompleted<T>(source: Observable<T>): boolean;
```

Checks if `Observable` is completed without value.

```ts
isImmediateCompleted(of(5)); // false

const subject = new Subject();
subject.complete();
isImmediateCompleted(subject); // true
```

### toPromise

```ts
type PromiseSubscriber<T, U = T> = (
  source: Observable<T>,
  resolve: (value: U) => void,
  reject: (error: unknown) => void
) => Subscription;
type PromiseSubscribed<T> = Promise<T> & { subscription: Subscription };

function toPromise<T>(source: Observable<T>): PromiseSubscribed<T | undefined>;
function toPromise<T, U>(
  source: Observable<T>,
  subscriber: PromiseSubscriber<T, U>
): PromiseSubscribed<U>;
```

Creates cancelable `Promise` from `Observable`, with attached `Subscription` instance. Can accept `subscriber` function that can control result of `Promise`.

Subscribers:

- `first<T>(): PromiseSubscriber<T>` - returns first value of `Observable`, throws `EmptyValueError` on complete;
- `last<T>(): PromiseSubscriber<T>` - returns last value of `Observable` on complete, if non throws `EmptyValueError`;
- `withInitial<T, U, I>(initial: T, subscriber: PromiseSubscriber<T, U>): PromiseSubscriber<T, U | I>` - return `initial` if `EmptyValueError` was thrown;
- `throttle<T, U>(subscriber: PromiseSubscriber<T, U>): PromiseSubscriber<T, U>` - on call unsubscribe from previous observable;

Without `subsciber` would use equivalent of `toPromise.withInitial(undefined, toPromise.last<T>())`. It means that each call of resulted callback would return last provided value on completion of `Observable`, would return `undefined` if value was not provided before completion.
