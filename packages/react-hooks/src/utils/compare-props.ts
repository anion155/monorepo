import type { DependencyList } from "react";

export function compareProps(
  prev: DependencyList,
  next: DependencyList
): boolean {
  if (next === prev) return true;
  if (next.length !== prev.length) return false;

  for (let index = 0; index < next.length; index += 1) {
    if (next[index] !== prev[index]) {
      return false;
    }
  }

  return true;
}
