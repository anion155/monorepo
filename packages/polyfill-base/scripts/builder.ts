#!/usr/bin/env jiti

import { main } from "@anion155/scripts-sources/utils/main";
import { $ } from "zx";

await main(async () => {
  await $`BUILDER_READY='rm dist/src/base.ts && cp ../polyfill-base/index.ts dist/src/base.ts' pnpm run builder`;
});
