#!/usr/bin/env jiti
import { styleText } from "node:util";
import { $ } from "zx";

try {
  await $`rm -rf dist`;
  await $`bunx tsc -p tsconfig.build.json --outDir dist/esm --module esnext`;
  await $`echo '{"type": "module"}' > dist/esm/package.json`;

  await $`bunx tsc -p tsconfig.build.json --outDir dist/cjs --module CommonJS --moduleResolution node`;
  await $`echo '{"type": "commonjs"}' > dist/cjs/package.json`;

  console.log(styleText("green", "Compilation successful"));
} catch (error) {
  console.error(
    styleText("red", "Compilation failed:"),
    typeof error === "object" && error !== null && "message" in error ? styleText("red", error.message as string) : (error as never),
  );
}
