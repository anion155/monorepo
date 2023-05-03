import { useContext } from "react";

import { warning } from "./bundled";
import type { SelectableContext, SelectableContextController } from "./types";

export const ControllerContextSymbol: unique symbol = Symbol(
  "SelectableContext#ControllerContext"
);

export const invalidController = Object.freeze({
  value: undefined,
  listeners: new Set(),
  subscribe: () => () => {},
} as SelectableContextController<unknown>);

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
    warning(false, "DeveloperError: SelectableContext is not provided");
  }
  return controller;
}
