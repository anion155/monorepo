#!/usr/bin/env jiti

import "./utils/polyfils";

import { $, cd } from "zx";
import { cdRoot } from "./utils/cd-root";
import { main } from "./utils/main";

await main(async (stack) => {
  await cdRoot();
  if (!process.argv.shift()?.endsWith("publisher.js")) process.argv.shift();
  await $`generate.exports`;
  await $`BUILDER_READY='rm dist/src/base.ts && cp ../polyfill-base/index.ts dist/src/base.ts' builder`;
  cd("dist");
  await $`pnpm pack --out package.tgz`;
  await $`pnpm publish package.tgz --dry-run --access public ${process.argv}`;
  cd("..");
  await $`pnpm version patch`;
});
