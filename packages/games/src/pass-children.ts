import type { ReactElement, ReactNode } from "react";
import { cloneElement } from "react";

export const passChildren = (element: ReactElement, children: ReactNode) => {
  if (!Array.isArray(children)) return cloneElement(element, undefined, children);
  return cloneElement(element, undefined, ...(children as never[]));
};
