import type { Context } from "react";
import { useContext as useContextOrig } from "react";

import { DeveloperError } from "../errors";

/**
 * Creates `useContext` that looks specifically into {@link context}.
 *
 * @throws {DeveloperError} By default throws {@link DeveloperError} if context not found,
 *   will be triggered on undefined context value, with {@link optional} will not throw error even without context.
 *
 * @example
 * const SpecificContext = createContext<SpecificValue | undefined>(undefined);
 * const useSpecificContext = createUseContext(SpecificContext, "SpecificContext");
 * ...
 * useSpecificContext(); // => SpecificValue
 */
export const createUseContext = <T>(context: Context<T>, name: string = context.displayName ?? "") => {
  /** Resolves context value for {@link context} */
  function useContext(optional: true): Exclude<T, undefined> | undefined;
  function useContext(optional?: false): Exclude<T, undefined>;
  function useContext(optional: boolean | undefined): Exclude<T, undefined> | undefined;
  function useContext(optional = false) {
    const value = useContextOrig(context);
    if (value === undefined && !optional) throw new DeveloperError(`should be wrapped in <${name}.Provider />`);
    return value as unknown;
  }
  return useContext;
};
