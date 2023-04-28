import { useCallback } from "react";
import { useSyncExternalStore } from "use-sync-external-store/shim";

import { useSelectableContextController } from "./internal";
import type { SelectableContext } from "./types";

const identitySelector = (value: unknown) => value;

export function useSelectableContext<T>(Context: SelectableContext<T>): T;
export function useSelectableContext<T, R>(
  Context: SelectableContext<T>,
  selector: (value: T) => R
): R;
export function useSelectableContext<T, R>(
  Context: SelectableContext<T>,
  selector?: (value: T) => R
): T | R;
export function useSelectableContext<T, R>(
  Context: SelectableContext<T>,
  selector: (value: T) => R = identitySelector as never
): T | R {
  const controller = useSelectableContextController(Context);
  const get = useCallback(() => {
    return selector(controller.value);
  }, [controller, selector]);

  const result = useSyncExternalStore(controller.subscribe, get);

  return result;
}
