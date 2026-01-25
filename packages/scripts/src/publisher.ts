#!/usr/bin/env jiti

import { $ } from "zx";
import { commandsParser, optionsParser } from "./utils/argv";
import { addLoggerOptions } from "./utils/logger";
import { cdNpmRoot, doInCwd, main } from "./utils/main";

await main(async (argv, { logger }) => {
  await cdNpmRoot();
  const [dryRun, loggerLevel, , version] = commandsParser(
    optionsParser().optionFlag("--dry-run").alias("-d").describe("Do not publish package").map(addLoggerOptions).optionHelp(),
  )
    .command("patch")
    .describe("Increase patch (0.0.x) version number")
    .command("minor")
    .describe("Increase patch (0.x.0) version number")
    .command("major")
    .describe("Increase patch (x.0.0) version number")
    .parse(argv);
  logger.level = loggerLevel;
  await $`pnpm run lint`;
  await $`pnpm run test`;
  await $`generate.exports`;
  if (version !== undefined) await $`pnpm version ${version}`;
  await $`builder`;
  await doInCwd("dist", async () => {
    await $`pnpm pack --out package.tgz`;
    if (!dryRun) await $`pnpm publish package.tgz --dry-run --access public ${process.argv}`;
  });
  if (version === undefined) await $`pnpm version patch`;
});
