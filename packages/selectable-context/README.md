# React Context with Selector

This library will help to manage renders of the children based on change of one field in the React Context.

## When to use it?

When you have setup like this, with multiple values in one Context:

```tsx
const CoolContext = createContext(undefined);
function CoolProvider({ children }) {
  const [value, setValue] = useState(55);
  const value = useMemo(() => ({ value, setValue, another: 'string' }), []);
  return <CoolContext.Provider value={value}>{children}</CoolContext.Provider>;
}
// ...
<CoolProvider>
  <CoolContext.Consumer>
    {({ value }) => {
      console.log('render with new value:', value);
      return <>This is the `value` value: {value}</>;
    }}
  </CoolContext.Consumer>
  <CoolContext.Consumer>
    {({ setValue }) => {
      console.log('render with new setValue:', setValue);
      return <button onClick={() => setValue(prev => prev + 1)}>Increase value</button>;
    }}
  </CoolContext.Consumer>
  <CoolContext.Consumer>
    {({ another }) => {
      console.log('render with new another:', another);
      return <>This is the `another` value: {another}</>;
    }}
  </CoolContext.Consumer>
</CoolProvider>
```

In this setup every time field `value` is changed all consumers are re-rendered, and the same goes for the changes of `another` field.

## How to use it?

Let's take same example and rewrite it without this unnecessary re-renders. It's pretty similar to React Context:

```tsx
import { createSelectableContext } from "@anion155/selectable-context";
// Here we are using library context implementation
const CoolContext = createSelectableContext(undefined);
function CoolProvider({ children }) {
  const [value, setValue] = useState(55);
  const value = useMemo(() => ({ value, setValue, another: 'string' }), []);
  return <CoolContext.Provider value={value}>{children}</CoolContext.Provider>;
}
// ...
<CoolProvider>
  {/* Here we declare selector for the value */}
  <CoolContext.Consumer selector={({ value }) => value}>
    {(value) => {
      console.log('render with new value:', value);
      return <>This is the `value` value: {value}</>;
    }}
  </CoolContext.Consumer>
  {/* Here we declare selector for the value */}
  <CoolContext.Consumer selector={({ setValue }) => setValue}>
    {(setValue) => {
      console.log('render with new setValue:', setValue);
      return <button onClick={() => setValue(prev => prev + 1)}>Increase value</button>;
    }}
  </CoolContext.Consumer>
  {/* Here we declare selector for the value */}
  <CoolContext.Consumer selector={({ another }) => another}>
    {(another) => {
      console.log('render with new another:', another);
      return <>This is the `another` value: {another}</>;
    }}
  </CoolContext.Consumer>
</CoolProvider>
```

Now when we will change `value` using `setValue` only first Consumer would be called for render.

> ### Quick tip
>
> With this setup we still need to separate render of children from render of Provider, whether by using `React.memo` on children Components or by rendering children separately (separate Provider component with it's inner state, and pass rendered elements through children prop)

## API

### createSelectableContext

Is a replacement of `React.createContext` and has similar api. Only exception is that Consumer now accepts `selector` property, which would select value passed to `children` function

```ts
function createSelectableContext<T>(defaultValue: T): SelectableContext<T>;

type SelectableProviderProps<T> = {
  value: T;
  children?: React.ReactNode | undefined;
};
type SelectableConsumerProps<T, R = T> = {
  selector?: (value: T) => R;
  children: (selected: R) => React.ReactNode;
};
type SelectableContext<T> = {
  Provider: FC<SelectableProviderProps<T>>;
  Consumer: <R = T>(props: SelectableConsumerProps<T, R>) => ReactElement;
  defaultValue: T;
};
```

> ### Note
>
> Created Context is not compatible with `React.useContext` and should be used with the following hook

### useSelectableContext

This hook accepts `Context` instance with optional `selector` and `isEqual`, and return it's current value as well as subscribes to value changes. It is using [`useSyncExternalStoreWithSelector`](https://reactjs.org/docs/hooks-reference.html#usesyncexternalstore) internally, so it does support minimum memoization of selector:

```ts
function useSelectableContext<T>(Context: SelectableContext<T>): T;
function useSelectableContext<T, R>(
  Context: SelectableContext<T>,
  selector: (value: T) => R,
  isEqual?: IsEqualBinary<T, R>
): R;
function useSelectableContext<T, R>(
  Context: SelectableContext<T>,
  selector?: (value: T) => R,
  isEqual?: IsEqualBinary<T, R>
): T | R;

type IsEqualBinary<T, R> = (
  a: T | NonNullable<R>,
  b: T | NonNullable<R>
) => boolean;
```

## Private API

Internally SelectableContext uses `React.Context` and passes Observable-like object with set of listeners and subscription method:

```ts
type SelectableContextController<T> = {
  value: T;
  listeners: Set<Listener<T>>;
  subscribe: Subscription<T>;
};
```

It is possible to gather this controller by using `useSelectableContextController` hook (available only as a source code)

```ts
import { useSelectableContextController } from "@anion155/selectable-context/internal";

const controller = useSelectableContextController(CoolContext);
console.log('Count of listeners on this render:', controller.listeners.size);
```

> ### Note
>
> Subscription of listener or change of context value would not mark component using this hook for re-render. `Controller` is created once for lifecycle of the component.
