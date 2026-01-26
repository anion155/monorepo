#!/usr/bin/env jiti

import { $ } from "zx";
import { cdNpmRoot, main, scriptHeader, scriptRunner } from "./utils/main";
import { ProgressBar } from "./utils/progress-bar";

const scripts = {
  pre: ["linter:pre", "LINTER_PRE"],
  post: ["linter:post", "LINTER_POST"],
} as const;

await main(async (_, { logger }) => {
  await cdNpmRoot();
  process.env.PATH = `${process.env.PATH}:./node_modules/.bin/`;
  const sourcePkg = await scriptHeader<PackageJsonExt>("Building package");
  const runScript = scriptRunner(sourcePkg);
  using pb = new ProgressBar({
    steps:
      2 + //
      (runScript.has(...scripts.pre) ? 1 : 0) +
      (runScript.has(...scripts.post) ? 1 : 0),
  });

  logger.success?.("Linting");
  if (await runScript(...scripts.pre)) pb.step();
  logger.info?.("Lint project");
  await $`eslint src`;
  pb.step();
  logger.info?.("TypeScript compiler run");
  await $`pnpm --package=typescript dlx tsc --noEmit --project ./tsconfig.build.json`;
  pb.step();
  if (await runScript(...scripts.post)) pb.step();
  logger.success?.("Complete");
  await Promise.delay(1000);
});
