import type { DependencyList } from "react";

import { useRenderDispatcher } from "./utils";

export function useFabric<T>(fabric: () => T, deps: DependencyList): T {
  return useRenderDispatcher(deps, () => fabric());
}
