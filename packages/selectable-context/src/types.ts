import type { FC, ReactElement } from "react";

export type Listener<T> = (value: T) => void;
export type Subscription<T> = (listener: Listener<T>) => () => void;

export type SelectableContextController<T> = {
  value: T;
  listeners: Set<Listener<T>>;
  subscribe: Subscription<T>;
};

export type SelectableProviderProps<T> = {
  value: T;
  children?: React.ReactNode | undefined;
};
export type SelectableConsumerProps<T, R = T> = {
  selector?: (value: T) => R;
  children: (selected: R) => React.ReactNode;
};
export type SelectableContext<T> = {
  Provider: FC<SelectableProviderProps<T>>;
  Consumer: <R = T>(props: SelectableConsumerProps<T, R>) => ReactElement;
  defaultValue: T;
};
