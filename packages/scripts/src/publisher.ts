#!/usr/bin/env jiti

import "./utils/polyfils";

import { $, cd } from "zx";
import { cdRoot } from "./utils/cd-root";
import { main } from "./utils/main";

await main(async (stack) => {
  await cdRoot();
  if (!process.argv.shift()?.endsWith("publisher.js")) process.argv.shift();
  await $`generate.exports`;
  await $`builder`;
  cd("dist");
  await $`pnpm pack --out package.tgz`;
  await $`pnpm publish package.tgz --dry-run --access public ${process.argv}`;
  cd("..");
  await $`pnpm version patch`;
});
