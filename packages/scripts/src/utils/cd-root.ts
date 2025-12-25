import { stat } from "node:fs/promises";
import { cd } from "zx";

function isRoot() {
  return stat("node_modules").then(
    () => true,
    () => false,
  );
}

export async function cdRoot() {
  while (!(await isRoot())) cd("..");
}
