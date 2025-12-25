#!/usr/bin/env jiti

import "./utils/polyfils";

import { glob } from "@anion155/shared/misc/glob";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { styleText } from "node:util";
import { cdRoot } from "./utils/cd-root";
import { main } from "./utils/main";
import { PackageJson } from "./utils/package.json";

const SUPPORTED_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx"];
const UNSUPPORTED_EXTENSIONS = SUPPORTED_EXTENSIONS.map((ext) => `.spec${ext}`).concat(...SUPPORTED_EXTENSIONS.map((ext) => `.spec-d${ext}`));

const add_dot = (filepath: string) => {
  filepath = path.join(".", filepath);
  if (filepath !== ".") filepath = "./" + filepath;
  return filepath;
};
const module = (filepath: string) => {
  filepath = add_dot(filepath);
  const ext = SUPPORTED_EXTENSIONS.find((ext) => filepath.endsWith(ext));
  if (ext) filepath = filepath.substring(0, filepath.length - ext.length);
  return filepath;
};

await main(async () => {
  await cdRoot();
  const exports: Record<string, string> = {};
  const pkg: PackageJson = await readFile("./package.json", "utf-8").then(JSON.parse);
  if (pkg["+exports"]) {
    for (const [name, module] of Object.entries(pkg["+exports"])) {
      if (typeof module === "string") {
        exports[name] = module;
      } else {
        // TODO: support complecated export
        // exports[name] = module;
      }
    }
  }
  const ignores = pkg["!exports"]?.map((pattern) => ({ glob: glob(pattern), nameonly: pattern.includes("/") })) ?? [];
  const traverseDir = async (dir: string, base: string) => {
    for (const file of await readdir(dir)) {
      const filepath = path.join(dir, file);
      if (ignores.find((ignore) => ignore.glob(ignore.nameonly ? file : filepath))) continue;
      const basepath = path.join(base, file);
      const fileStats = await stat(filepath);
      if (fileStats.isDirectory()) {
        await traverseDir(filepath, basepath);
      } else if (SUPPORTED_EXTENSIONS.find((ext) => file === `index${ext}`)) {
        exports[module(base)] = add_dot(filepath);
      } else if (SUPPORTED_EXTENSIONS.find((ext) => file.endsWith(ext)) && !UNSUPPORTED_EXTENSIONS.find((ext) => file.endsWith(ext))) {
        exports[module(basepath)] = add_dot(filepath);
      }
    }
  };
  await traverseDir("src", "");
  pkg.exports = exports;
  await writeFile("./package.json", JSON.stringify(pkg, undefined, 2) + "\n");

  console.log(styleText("green", "Exports updated"));
});
