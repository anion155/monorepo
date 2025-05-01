import type { Context as ReactContext, FC, ReactNode } from "react";
import { createContext as createReactContext, useContext as useReactContext, useEffect, useSyncExternalStore } from "react";

import { DeveloperError } from "../../errors";
import { identity } from "../../functional";
import { hasField } from "../../is";
import { appendProperty } from "../../object";
import { useConst } from "../use-const";

export type SelectableContextController<Context> = {
  value: Context;
  listeners: Set<() => void>;
  subscribe: (onChange: () => void) => () => void;
};
export type SelectableContext<Context> = {
  Provider: FC<{ value: Context; children?: ReactNode }>;
  Consumer: FC<{ children: (current: Context) => React.ReactNode }>;
  Selector: {
    <Selected>(props: { selector: (current: Context) => Selected; children: (selected: Selected) => React.ReactNode }): ReactNode;
    displayName?: string;
  };
  defaultValue: Context;
};

const InnerContextSymbol = Symbol.for("@anion155/shared/react/selectable-context/inner-context");

const invalidController = Object.freeze({
  value: undefined,
  listeners: new Set(),
  subscribe: () => () => {},
} as SelectableContextController<unknown>);

const useSelectableContextController = <Context,>(Context: SelectableContext<Context>) => {
  if (!hasField(Context, InnerContextSymbol)) throw new DeveloperError("Context isn't instance of SelectableContext");
  return useReactContext(Context[InnerContextSymbol] as ReactContext<SelectableContextController<Context>>);
};
export const useSelectableContext: {
  <Context, Selected>(Context: SelectableContext<Context>, selector: (value: Selected) => Selected): Context;
  <Context>(Context: SelectableContext<Context>): Context;
} = <Context, Selected>(Context: SelectableContext<Context>, selector: (value: Context) => Selected = identity as never) => {
  const controller = useSelectableContextController(Context);
  return useSyncExternalStore(controller.subscribe, () => {
    const result = selector(controller.value);
    console.log("");
    return result;
  });
};

export function createSelectableContext<Context>(defaultValue: Context, displayName?: string): SelectableContext<Context> {
  const Context = createReactContext<SelectableContextController<Context>>({ ...invalidController, value: defaultValue } as never);
  const SelectableContext: SelectableContext<Context> = {
    // eslint-disable-next-line react/prop-types
    Provider({ value, children }) {
      const controller = useConst<SelectableContextController<Context>>(() => ({
        value,
        listeners: new Set(),
        subscribe: (onChange) => {
          controller.listeners.add(onChange);
          return () => controller.listeners.delete(onChange);
        },
      }));
      useEffect(() => {
        controller.value = value;
        controller.listeners.forEach((listener) => listener());
      }, [controller, value]);
      return <Context.Provider value={controller}>{children}</Context.Provider>;
    },
    // eslint-disable-next-line react/prop-types
    Consumer({ children }) {
      return <>{children(useSelectableContext(SelectableContext))}</>;
    },
    // eslint-disable-next-line react/prop-types
    Selector({ selector, children }) {
      return <>{children(useSelectableContext(SelectableContext, selector as never) as never)}</>;
    },
    defaultValue,
  };
  appendProperty(SelectableContext, InnerContextSymbol, { value: Context, writable: false, enumerable: false, configurable: false });
  SelectableContext.Provider.displayName = `${displayName}.Provider`;
  SelectableContext.Consumer.displayName = `${displayName}.Consumer`;
  SelectableContext.Selector.displayName = `${displayName}.Selector`;
  Object.preventExtensions(SelectableContext);
  Object.freeze(SelectableContext);
  return SelectableContext;
}
