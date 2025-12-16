import { useRef } from "react";

import { compare } from "../misc";

/**
 * Keep same reference between renders until passed value is different deeply.
 *
 * @example
 *  const Component = ({ prop }) => {
 *    const value = useDeepMemo({ prop })
 *    useEffect(() => {}, [value])
 *  };
 */
export function useDeepMemo<Value>(value: Value, deep?: number | boolean) {
  const memoized = useRef(value);
  if (!compare(memoized.current, value, deep)) {
    memoized.current = value;
  }
  return memoized.current;
}
