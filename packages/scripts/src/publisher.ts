#!/usr/bin/env jiti

import { $ } from "zx";
import { commandsParser, optionsParser } from "./utils/argv";
import { cdRoot } from "./utils/cd-root";
import { addLoggerOptions } from "./utils/logger";
import { doCwd, main } from "./utils/main";

await main(async (argv) => {
  await cdRoot();
  const [dryRun, version] = commandsParser(
    optionsParser().optionFlag("--dry-run").alias("-d").describe("Do not publish package").map(addLoggerOptions).optionHelp(),
  )
    .command("patch")
    .command("minor")
    .command("major")
    .command("undefined")
    .parse(argv);
  await $`pnpm run lint`;
  await $`pnpm run test`;
  await $`generate.exports`;
  if (version !== undefined) await $`pnpm version ${version}`;
  await $`builder`;
  await doCwd("dist", async () => {
    await $`pnpm pack --out package.tgz`;
    if (!dryRun) await $`pnpm publish package.tgz --dry-run --access public ${process.argv}`;
  });
  if (version === undefined) await $`pnpm version patch`;
});
