#!/usr/bin/env jiti

import "./utils/polyfils";

import { hasTypedField } from "@anion155/shared/is";
import { applyConsoleFormat } from "@anion155/shared/misc";
import { readFile, writeFile } from "node:fs/promises";
import { $, cd } from "zx";
import { cdRoot } from "./utils/cd-root";
import { directPrint } from "./utils/direct-print";
import { main } from "./utils/main";
import { PackageJson } from "./utils/package.json";
import { ProgressBar } from "./utils/progress-bar";

await main(async (stack) => {
  directPrint(applyConsoleFormat("fgGreen", "Building package") + "\r");
  process.env.PATH = `${process.env.PATH}:./node_modules/.bin/`;
  await cdRoot();
  const sourcePkg: PackageJson = await readFile("./package.json", "utf-8").then(JSON.parse);
  if (sourcePkg.name) console.log(applyConsoleFormat("green", `Building package [${sourcePkg.name}]`));
  const pb = new ProgressBar();
  stack.append(pb);

  if (hasTypedField(sourcePkg.scripts, "builder:pre", "string")) {
    await $`pnpm run builder:pre`;
  }

  pb.step(1 / 5);
  await $`rm -rf dist`;
  pb.step(2 / 5);
  await $`mkdir -p dist/src/../lib/`;
  pb.step(3 / 5);
  await $`rsync -av --exclude *.spec.* --exclude *.spec-d.* src/ dist/src/`;
  pb.step(4 / 5);
  if (hasTypedField(sourcePkg.scripts, "builder:ready", "string")) {
    await $`pnpm run builder:ready`;
  }
  if (hasTypedField(sourcePkg.scripts, "builder:tsc", "string")) {
    await $`pnpm run builder:tsc`;
  } else {
    cd("dist");
    await writeFile(
      "tsconfig.json",
      JSON.stringify({ extends: "../tsconfig.build.json", include: ["src/**/*.ts", "src/**/*.tsx"] }, undefined, 2) + "\n",
    );
    await $`pnpm --package=typescript dlx tsc --outDir lib`;
    await $`rm tsconfig.json`;
    cd("..");
  }
  pb.step(5 / 5);

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
  await writeFile("dist/package.json", JSON.stringify(resultPkg, undefined, 2) + "\n");

  if (hasTypedField(sourcePkg.scripts, "builder:post", "string")) {
    await $`pnpm run builder:post`;
  }

  console.log(applyConsoleFormat("green", "Ready to publish"));
});
