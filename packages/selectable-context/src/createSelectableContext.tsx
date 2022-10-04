import { createContext, useEffect, useMemo } from "react";

import { ControllerContextSymbol, invalidController } from "./internal";
import type {
  SelectableConsumerProps,
  SelectableContext,
  SelectableContextController,
  SelectableProviderProps,
} from "./types";
import { useSelectableContext } from "./useSelectableContext";

export function createSelectableContext<T>(
  defaultValue: T
): SelectableContext<T> {
  const Context = createContext<SelectableContextController<T>>(
    invalidController as never
  );
  const SelectableContext: SelectableContext<T> = {
    Provider: null as never,
    Consumer: null as never,
    defaultValue,
  };
  Object.defineProperty(SelectableContext, ControllerContextSymbol, {
    enumerable: false,
    writable: false,
    value: Context,
  });

  function Provider({ value, children }: SelectableProviderProps<T>) {
    const controller = useMemo(() => {
      const newController: SelectableContextController<T> = {
        listeners: new Set(),
        subscribe: undefined as never,
        value: undefined as never,
      };
      newController.subscribe = (listener) => {
        newController.listeners.add(listener);
        return () => {
          newController.listeners.delete(listener);
        };
      };
      return newController;
    }, []);
    controller.value = value;

    useEffect(() => {
      controller.listeners.forEach((listener) => listener(value));
    }, [controller, value]);

    return <Context.Provider value={controller}>{children}</Context.Provider>;
  }
  SelectableContext.Provider = Provider;

  function Consumer<R>({ selector, children }: SelectableConsumerProps<T, R>) {
    const selected = useSelectableContext(SelectableContext, selector);
    return <>{children(selected as never)}</>;
  }
  SelectableContext.Consumer = Consumer;

  return SelectableContext;
}
