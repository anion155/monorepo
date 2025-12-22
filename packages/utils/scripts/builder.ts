#!/usr/bin/env jiti

import "@anion155/shared/global/promise";

import { Loop } from "@anion155/shared/loop";
import { applyConsoleFormat } from "@anion155/shared/misc";
import { printBuffer } from "@anion155/shared/misc/print";
import { readFile, stat, writeFile } from "node:fs/promises";
import { $, cd } from "zx";

function isRoot() {
  return stat("node_modules").then(
    () => true,
    () => false
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

async function printProgressBar({
  progress,
  length,
  head = "[",
  tail = "]",
  inclusive = true,
}: {
  progress: number;
  length: number;
  head?: string;
  tail?: string;
  inclusive?: boolean;
}) {
  const columns = process.stdout.columns;
  const barsLength = inclusive ? length - head.length - tail.length : Math.min(length + head.length + tail.length, columns);
  const complete = Math.trunc(progress * barsLength);
  const completeBars = "#".repeat(complete);
  const emptyBars = "-".repeat(barsLength - complete);
  const filler = " ".repeat(columns - head.length - barsLength - tail.length);
  await printBuffer(`${head}${completeBars}${emptyBars}${tail}${filler}\r`);
}

const progressBar = () => {
  const loader = ["⢿", "⣻", "⣽", "⣾", "⣷", "⣯", "⣟", "⡿"];
  let step = 0;
  let progress = 0;
  const loop = new Loop(200, async () => {
    const percentage = Math.trunc(progress * 100);
    await printProgressBar({
      progress,
      length: process.stdout.columns,
      inclusive: true,
      head: ` ${loader[step++ % loader.length]}[`,
      tail: `] ${percentage.toString().padStart(3, " ")}%`,
    });
  });
  return {
    step(next: number) {
      progress = next;
    },
    async finish() {
      progress = 1;
      await loop.start();
      console.log("");
      loop.stop();
    },
  };
};

try {
  await printBuffer(applyConsoleFormat("green", "Building package\r"));
  process.env.PATH = `${process.env.PATH}:./node_modules/.bin/`;
  while (!(await isRoot())) cd("..");
  const sourcePkg: PackageJson = await readFile("./package.json", "utf-8").then(JSON.parse);
  if (sourcePkg.name) console.log(applyConsoleFormat("green", `Building package [${sourcePkg.name}]`));
  const pb = progressBar();

  pb.step(1 / 6);
  await Promise.delay(1000);
  await $`rm -rf dist`;
  pb.step(2 / 6);
  await Promise.delay(1000);
  await $`mkdir -p dist/src/../lib/`;
  pb.step(3 / 6);
  await Promise.delay(1000);
  await $`cp -r src/ dist/src/`;
  pb.step(4 / 6);
  await Promise.delay(1000);
  await $`pnpm --package=typescript dlx tsc --project tsconfig.build.json --outDir dist/lib`;
  pb.step(5 / 6);
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
  await pb.finish();
  console.log(applyConsoleFormat("green", "Ready to publish"));
} catch (error) {
  console.error(
    applyConsoleFormat("red", "Compilation failed:"),
    typeof error === "object" && error !== null && "message" in error ? applyConsoleFormat("red", error.message as string) : (error as never)
  );
}
