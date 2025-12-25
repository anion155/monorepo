#!/usr/bin/env jiti

import "./utils/polyfils";

import { writeFile } from "node:fs/promises";
import { $, cd } from "zx";
import { ScriptLogger } from "./utils/logger";
import { main, scriptHeader } from "./utils/main";
import { PackageJson } from "./utils/package.json";
import { ProgressBar } from "./utils/progress-bar";
import { scriptRunner } from "./utils/script-runner";

const logger = new ScriptLogger("builder");

await main(async (stack) => {
  process.env.PATH = `${process.env.PATH}:./node_modules/.bin/`;
  const sourcePkg = await scriptHeader(logger, "Building package");

  const runScript = scriptRunner(sourcePkg, logger);
  const pb = new ProgressBar();
  stack.append(pb);

  await runScript("builder:pre");
  pb.step(1 / 4);

  logger.info?.("preparing dist");
  await $`rm -rf dist`;
  await $`mkdir -p dist/src/../lib/`;
  pb.step(2 / 4);
  await $`rsync -av --exclude *.spec.* --exclude *.spec-d.* src/ dist/src/`;
  pb.step(3 / 4);

  logger.info?.("building");
  await runScript("builder:ready");
  if (!(await runScript("builder:tsc"))) {
    cd("dist");
    await writeFile(
      "tsconfig.json",
      JSON.stringify({ extends: "../tsconfig.build.json", include: ["src/**/*.ts", "src/**/*.tsx"] }, undefined, 2) + "\n",
    );
    await $`pnpm --package=typescript dlx tsc --outDir lib`;
    await $`rm tsconfig.json`;
    cd("..");
  }
  pb.step(4 / 4);

  const resultPkg: PackageJson = {
    name: sourcePkg.name,
    version: sourcePkg.version,
    description: sourcePkg.description,
    keywords: sourcePkg.keywords,
    author: sourcePkg.author,
    repository: sourcePkg.repository,
    license: sourcePkg.license,
    type: sourcePkg.type,
    exports: sourcePkg.exports,
    dependencies: sourcePkg.dependencies,
  };
  if (sourcePkg["!dependencies"]) {
    logger.log?.("remove dependencies:", sourcePkg["!dependencies"]);
    const dependencies = { ...resultPkg.dependencies };
    sourcePkg["!dependencies"].forEach((dep) => {
      delete dependencies[dep];
    });
    resultPkg.dependencies = dependencies;
  }
  await writeFile("dist/package.json", JSON.stringify(resultPkg, undefined, 2) + "\n");

  await runScript("builder:post");

  logger.success?.("Ready to publish");
});
