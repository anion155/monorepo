#!/usr/bin/env jiti

import "./utils/polyfils";

import { isTruthy } from "@anion155/shared/is";
import { Glob, glob } from "@anion155/shared/misc";
import { readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { $, cd } from "zx";
import { ScriptLogger } from "./utils/logger";
import { main, scriptHeader } from "./utils/main";
import { ProgressBar } from "./utils/progress-bar";
import { scriptRunner } from "./utils/script-runner";

const logger = new ScriptLogger("builder");
const scripts = {
  pre: "builder:pre",
  ready: "builder:ready",
  tsc: "builder:tsc",
  post: "builder:post",
} as const;

declare global {
  interface PackageJsonExt {
    "+scripts"?: string[];
    "!dependencies"?: string[];
  }
}

await main(async (stack) => {
  process.env.PATH = `${process.env.PATH}:./node_modules/.bin/`;
  const sourcePkg = await scriptHeader<PackageJsonExt>(logger, "Building package");

  const runScript = scriptRunner(sourcePkg, logger);
  const pb = new ProgressBar({
    steps:
      4 +
      (runScript.has(scripts.pre) ? 1 : 0) +
      (runScript.has(scripts.ready) ? 1 : 0) +
      (runScript.has(scripts.tsc) ? 1 : 3) +
      (runScript.has(scripts.post) ? 1 : 0),
  });
  stack.append(pb);

  if (await runScript(scripts.pre)) pb.step();

  logger.info?.("preparing dist");
  logger.log?.("removing old dist");
  await $`rm -rf dist`;
  pb.step();
  logger.log?.("create directory structure");
  await $`mkdir -p dist/src/../lib/`;
  pb.step();
  logger.log?.("copy source files to dist/src/");
  await $`rsync -av --exclude *.spec.* --exclude *.spec-d.* src/ dist/src/`;
  pb.step();

  logger.info?.("building");
  if (await runScript(scripts.ready)) pb.step();
  if (await runScript(scripts.tsc)) {
    pb.step();
  } else {
    cd("dist");
    await writeFile(
      "tsconfig.json",
      JSON.stringify({ extends: "../tsconfig.build.json", include: ["src/**/*.ts", "src/**/*.tsx"] }, undefined, 2) + "\n",
    );
    await $`pnpm --package=typescript dlx tsc --outDir lib`;
    await $`rm tsconfig.json`;
    cd("..");
    pb.step();
  }

  logger.info?.("copying files to dist/");
  const files: Glob[] = [glob("README*"), glob("LICENSE*"), glob("LICENCE*"), glob("LICENCE*")];
  const ignoreFiles: Glob[] = [
    glob(".git"),
    glob(".npmrc"),
    glob("node_modules"),
    glob("package-lock.json"),
    glob("package.json"),
    glob("pnpm-lock.yaml"),
    glob("yarn.lock"),
    glob("bun.lockb"),
  ];
  if (sourcePkg.files) {
    sourcePkg.files.forEach((pattern) => {
      if (pattern.startsWith("!")) ignoreFiles.push(glob(pattern.substring(1)));
      else files.push(glob(pattern));
    });
  }
  if (typeof sourcePkg.bin === "string") {
    files.push(glob(sourcePkg.bin));
  } else if (sourcePkg.bin) {
    Object.entries(sourcePkg.bin).forEach(([, bin]) => {
      files.push(glob(bin));
    });
  } else if (sourcePkg.directories?.bin) {
    files.push(glob(`${sourcePkg.directories.bin}/**`));
  }
  if (typeof sourcePkg.man === "string") {
    files.push(glob(sourcePkg.man));
  } else if (sourcePkg.man?.length) {
    files.push(...sourcePkg.man.map((man) => glob(man)));
  } else if (sourcePkg.directories?.man) {
    files.push(glob(`${sourcePkg.directories.man}/**`));
  }
  const traverseDir = async (dir: string) => {
    for (const file of await readdir(dir)) {
      const filepath = path.join(dir, file);
      const fileStats = await stat(filepath);
      if (fileStats.isDirectory()) {
        await traverseDir(filepath);
      } else if (!files.find((pattern) => pattern(filepath))) {
      } else if (ignoreFiles.every((pattern) => !pattern(filepath))) {
        logger.log?.("  ", filepath);
        await $`mkdir -p "dist/${dir}"`;
        await $`cp "${filepath}" "dist/${filepath}"`;
      }
    }
  };
  await traverseDir(".");

  logger.info?.("build package.json");
  const resultPkg: PackageJson = {
    name: sourcePkg.name,
    version: sourcePkg.version,
    description: sourcePkg.description,
    keywords: sourcePkg.keywords,
    license: sourcePkg.license,
    author: sourcePkg.author,
    contributors: sourcePkg.contributors,
    homepage: sourcePkg.homepage,
    repository: sourcePkg.repository,
    bugs: sourcePkg.bugs,
    funding: sourcePkg.funding,

    type: sourcePkg.type,
    exports: sourcePkg.exports,
    main: sourcePkg.main,
    types: sourcePkg.types,
    browser: sourcePkg.browser,

    files: sourcePkg.files,
    bin: sourcePkg.bin,
    man: sourcePkg.man,
    directories: sourcePkg.directories,

    // scripts: sourcePkg.scripts,
    gypfile: sourcePkg.gypfile,
    config: sourcePkg.config,

    dependencies: sourcePkg.dependencies,
    // devDependencies: sourcePkg.devDependencies,
    peerDependencies: sourcePkg.peerDependencies,
    peerDependenciesMeta: sourcePkg.peerDependenciesMeta,
    bundleDependencies: sourcePkg.bundleDependencies,
    optionalDependencies: sourcePkg.optionalDependencies,
    // overrides: sourcePkg.overrides,

    engines: sourcePkg.engines,
    os: sourcePkg.os,
    cpu: sourcePkg.cpu,
    libc: sourcePkg.libc,
  };
  if (sourcePkg.scripts) {
    const scripts = sourcePkg["+scripts"]?.map((pattern) => glob(pattern)) ?? [];
    if (!scripts.find((pattern) => pattern("postinstall"))) scripts.push(glob("postinstall"));
    logger.log?.(
      "filtering scripts:",
      scripts.map(({ pattern }) => pattern),
    );
    const entries = Object.entries(sourcePkg.scripts).filter(([name]) => scripts.find((pattern) => pattern(name)));
    if (entries.length) {
      entries.forEach(([name, script]) => logger.log?.(`  ${JSON.stringify(name)}: ${JSON.stringify(script)},`));
      resultPkg.scripts = Object.fromEntries(entries);
    } else {
      logger.log?.("no scripts left after filtering");
    }
  }
  if (sourcePkg["!dependencies"]?.length) {
    logger.log?.("filtering dependencies:", sourcePkg["!dependencies"]);
    const dependenciess = (
      [
        ["dependencies", { ...resultPkg.dependencies }],
        ["peerDependencies", { ...resultPkg.peerDependencies }],
        ["peerDependenciesMeta", { ...resultPkg.peerDependenciesMeta }],
        Array.isArray(resultPkg.bundleDependencies) ? ["bundleDependencies", resultPkg.bundleDependencies] : undefined,
        ["optionalDependencies", { ...resultPkg.optionalDependencies }],
      ] satisfies Array<[keyof PackageJson, Record<string, unknown> | string[]] | undefined>
    ).filter(isTruthy);
    sourcePkg["!dependencies"].forEach((ignoreDep) =>
      dependenciess.forEach(([, dependencies]) => {
        if (Array.isArray(dependencies)) {
          dependencies = dependencies.filter((dep) => dep !== ignoreDep);
        } else {
          delete dependencies[ignoreDep];
        }
      }),
    );
    dependenciess.forEach(([name, dependencies]) => {
      if (Object.keys(dependencies).length === 0) {
        delete resultPkg[name];
      } else {
        // @ts-expect-error
        resultPkg[name] = dependencies;
      }
    });
  }
  await writeFile("dist/package.json", JSON.stringify(resultPkg, undefined, 2) + "\n");
  pb.step();

  if (await runScript(scripts.post)) pb.step();

  logger.success?.("Ready to publish");
});
