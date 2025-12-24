#!/usr/bin/env jiti

import "@anion155/proposal-explicit-resource-management/global";
import "@anion155/shared/global/promise";

import { applyConsoleFormat } from "@anion155/shared/misc";
import { readFile, stat, writeFile } from "node:fs/promises";
import { $, cd } from "zx";
import { directPrint } from "./utils/direct-print";
import { main } from "./utils/main";
import { ProgressBar } from "./utils/progress-bar";

function isRoot() {
  return stat("node_modules").then(
    () => true,
    () => false,
  );
}

type PackageJsonExport = {};
type PackageJson = {
  name?: string;
  version?: string;
  description?: string;
  keywords?: string[];
  author?: string | { name?: string; url?: string };
  repository?: string | { type: "git"; url: string; directory?: string };
  license?: string;
  type?: "module";
  exports?: Record<string, string | PackageJsonExport>;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

await main(async (stack) => {
  directPrint(applyConsoleFormat("fgGreen", "Building package") + "\r");
  process.env.PATH = `${process.env.PATH}:./node_modules/.bin/`;
  while (!(await isRoot())) cd("..");
  const sourcePkg: PackageJson = await readFile("./package.json", "utf-8").then(JSON.parse);
  if (sourcePkg.name) console.log(applyConsoleFormat("green", `Building package [${sourcePkg.name}]`));
  let pb = new ProgressBar();
  stack.append(pb);

  pb.step(1 / 6);
  console.log("GGHH");
  await Promise.delay(1000);
  await $`rm -rf dist`;
  pb.step(2 / 6);
  console.log("GG");
  await Promise.delay(1000);
  await $`mkdir -p dist/src/../lib/`;
  pb.step(3 / 6);
  console.log("GG");
  await Promise.delay(1000);
  await $`cp -r src/ dist/src/`;
  pb.step(4 / 6);
  console.log("GG");
  await Promise.delay(1000);
  await $`pnpm --package=typescript dlx tsc --project tsconfig.build.json --outDir dist/lib`;
  pb.step(5 / 6);
  console.log("GG");
  await Promise.delay(1000);

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
  delete (resultPkg.dependencies as never)["@anion155/polyfill-base"];
  await writeFile("dist/package.json", JSON.stringify(resultPkg, undefined, 2) + "\n");
  pb.dispose();
  console.log(applyConsoleFormat("green", "Ready to publish"));
});
