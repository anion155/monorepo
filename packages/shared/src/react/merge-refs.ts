import type { ForwardedRef } from "react";

/**
 * Merge React refs.
 * @example
 *  const Exmaple = ({ ref }) => {
 *    const compRef = useRef(null);
 *    return <Component ref={mergeRefs(ref, compRef, (node) => console.log('Node:', node))} />
 *  }
 */
export const mergeRefs =
  <T>(...refs: Array<ForwardedRef<T> | undefined | null | false>) =>
  (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    }
  };
