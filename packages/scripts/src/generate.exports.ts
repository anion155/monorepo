#!/usr/bin/env jiti

import "./utils/polyfils";

import { glob } from "@anion155/shared/misc/glob";
import { readdir, stat, writeFile } from "node:fs/promises";
import path, { normalize } from "node:path";
import { ScriptLogger } from "./utils/logger";
import { main, scriptHeader } from "./utils/main";
import { PackageJsonConditionalExport } from "./utils/package.json";
import { ProgressBar } from "./utils/progress-bar";

const logger = new ScriptLogger("generate.exports");

const SUPPORTED_EXTENSIONS = [".js", ".jsx", ".d.ts", ".ts", ".d.tsx", ".tsx"];
const UNSUPPORTED_EXTENSIONS = SUPPORTED_EXTENSIONS.map((ext) => `.spec${ext}`).concat(...SUPPORTED_EXTENSIONS.map((ext) => `.spec-d${ext}`));

const addDot = (filepath: string) => {
  filepath = path.join(".", filepath);
  if (filepath !== ".") filepath = "./" + filepath;
  return filepath;
};
const exportModule = (filepath: string): PackageJsonConditionalExport => {
  return { types: addDot(filepath), import: path.join("lib/esm", filepath), require: path.join("lib/cjs", filepath), default: addDot(filepath) };
};
const module = (filepath: string) => {
  filepath = addDot(filepath);
  const ext = SUPPORTED_EXTENSIONS.find((ext) => filepath.endsWith(ext));
  if (ext) filepath = filepath.substring(0, filepath.length - ext.length);
  return filepath;
};

declare global {
  interface PackageJsonExt {
    "+exports"?: Record<string, string | PackageJsonConditionalExport>;
    "!exports"?: string[];
  }
}

await main(async (stack) => {
  const pkg = await scriptHeader<PackageJsonExt>(logger, "Generating exports");

  const pb = new ProgressBar({ steps: 2 });
  stack.append(pb);

  const exports: Record<string, string | PackageJsonConditionalExport> = {};
  if (pkg["+exports"]) {
    for (const [name, module] of Object.entries(pkg["+exports"])) {
      if (typeof module === "string") {
        exports[name] = module;
      } else {
        // TODO: support complicated export
        // exports[name] = module;
      }
    }
  }
  const ignores =
    pkg["!exports"]?.map((pattern) => {
      if (pattern.includes("/")) return Object.assign(glob(normalize(pattern)), { nameonly: false });
      return Object.assign(glob(pattern), { nameonly: true });
    }) ?? [];
  logger.info?.(
    "ignore pattern:",
    ignores.map((glob) => ({ pattern: glob.pattern, nameonly: glob.nameonly })),
  );
  const traverseDir = async (dir: string, base: string) => {
    for (const file of await readdir(dir)) {
      const filepath = path.join(dir, file);
      {
        const glob = ignores.find((glob) => glob(glob.nameonly ? file : filepath));
        if (glob) {
          logger.warn?.("ignoring:", filepath, ", because of:", glob.pattern);
          continue;
        }
      }
      logger.log?.("export:", filepath);
      const basepath = path.join(base, file);
      const fileStats = await stat(filepath);
      if (fileStats.isDirectory()) {
        await traverseDir(filepath, basepath);
      } else if (SUPPORTED_EXTENSIONS.find((ext) => file === `index${ext}`)) {
        exports[module(base)] = exportModule(filepath);
      } else if (SUPPORTED_EXTENSIONS.find((ext) => file.endsWith(ext)) && !UNSUPPORTED_EXTENSIONS.find((ext) => file.endsWith(ext))) {
        exports[module(basepath)] = exportModule(filepath);
      }
    }
  };
  await traverseDir("src", "");
  pkg.exports = exports;
  pb.step();

  await writeFile("./package.json", JSON.stringify(pkg, undefined, 2) + "\n");
  pb.step();

  logger.success?.("Exports updated");
});
