import { useSyncExternalStoreWithSelector } from "use-sync-external-store/shim/with-selector";

import { useSelectableContextController } from "./internal";
import type { SelectableContext } from "./types";

export type IsEqualBinary<T, R> = (
  a: T | NonNullable<R>,
  b: T | NonNullable<R>
) => boolean;

export function useSelectableContext<T>(Context: SelectableContext<T>): T;
export function useSelectableContext<T, R>(
  Context: SelectableContext<T>,
  selector: (value: T) => R,
  isEqual?: IsEqualBinary<T, R>
): R;
export function useSelectableContext<T, R>(
  Context: SelectableContext<T>,
  selector?: (value: T) => R,
  isEqual?: IsEqualBinary<T, R>
): T | R;
export function useSelectableContext<T, R>(
  Context: SelectableContext<T>,
  selector?: (value: T) => R,
  isEqual?: IsEqualBinary<T, R>
): T | R {
  const controller = useSelectableContextController(Context);
  const result = useSyncExternalStoreWithSelector(
    controller.subscribe,
    () => controller.value,
    null,
    (state) => selector?.(state) ?? state,
    isEqual
  );

  return result;
}
