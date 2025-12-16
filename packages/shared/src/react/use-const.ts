import { useRef } from "react";

import { useDispose } from "./use-dispose";

/**
 * On first render stores return value of {@link fabric}. On unmount tries to dispose
 *
 * @example
 *  class Logic {
 *    [Symbol.dispose]() {}
 *  }
 *
 *  const Component = () => {
 *    const instance = useConst(() => new Logic())
 *  };
 */
export function useConst<Value>(fabric: () => Value) {
  const store = useRef<{ value: Value } | undefined>(undefined);
  if (!store.current) {
    store.current = { value: fabric() };
  }
  const value = store.current.value;
  useDispose(value);
  return value;
}
