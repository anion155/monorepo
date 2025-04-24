import type { DependencyList } from "react";

import { useDispose } from "./use-dispose";
import { useRenderDispatcher } from "./utils";

/**
 * Creates value from {@link fabric}, disposes previous instances.
 *
 * @example
 * class Logic {
 *   [Symbol.dispose]() {}
 * }
 *
 * const Component = ({ param }) => {
 *   const instance = useFabric(() => new Logic(param), [param])
 * };
 */
export function useFabric<Value>(fabric: () => Value, deps: DependencyList) {
  const value = useRenderDispatcher(deps, () => fabric());
  useDispose(value);
  return value;
}
