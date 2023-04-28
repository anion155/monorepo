import { useContext } from "react";

import type { SelectableContext, SelectableContextController } from "./types";

import "./global";

export const ControllerContextSymbol: unique symbol = Symbol(
  "SelectableContext#ControllerContext"
);

export const invalidController = Object.freeze({
  value: undefined,
  listeners: new Set(),
  subscribe: () => () => {},
} as SelectableContextController<unknown>);

export const INVALID_CONTEXT_ERROR_MESSAGE =
  "DeveloperError: SelectableContext is not provided";

export type SelectableContextWithController<T> = SelectableContext<T> & {
  [ControllerContextSymbol]: React.Context<SelectableContextController<T>>;
};

export function controllerContext<T>(context: SelectableContext<T>) {
  return (context as SelectableContextWithController<T>)[
    ControllerContextSymbol
  ];
}

export function useSelectableContextController<T>(
  Context: SelectableContext<T>
) {
  let controller = useContext(controllerContext(Context));
  if (controller === invalidController) {
    controller = { ...controller, value: Context.defaultValue };
    if (__DEV__) {
      // eslint-disable-next-line no-console -- debugging message
      console.warn(INVALID_CONTEXT_ERROR_MESSAGE);
    }
  }
  return controller;
}
