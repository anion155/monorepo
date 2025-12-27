#!/usr/bin/env jiti

import "./utils/polyfils";

import { $, cd } from "zx";
import { cdRoot } from "./utils/cd-root";
import { main } from "./utils/main";

$.verbose = true;

await main(async (stack) => {
  await cdRoot();
  await $`generate.exports`;
  await $`BUILDER_READY='rm dist/src/base.ts && cp ../polyfill-base/index.ts dist/src/base.ts' builder`;
  cd("dist");
  await $`pnpm publish --access public`.stdio("inherit");
  cd("..");
  await $`pnpm version patch`;
});
