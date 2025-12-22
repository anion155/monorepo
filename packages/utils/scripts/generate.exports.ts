#!/usr/bin/env node
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { styleText } from "node:util";

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

try {
  const exports: Record<string, string> = {};
  const traverseDir = async (dir: string, base: string) => {
    for (const file of await readdir(dir)) {
      const filepath = path.join(dir, file);
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
  const pkg: { exports?: Record<string, string> } = await readFile("./package.json", "utf-8").then(JSON.parse);
  if ("extraExports" in pkg && typeof pkg.extraExports === "object" && pkg.extraExports) {
    for (const [name, module] of Object.entries(pkg.extraExports)) {
      exports[name] = module;
    }
  }
  pkg.exports = exports;
  await writeFile("./package.json", JSON.stringify(pkg, undefined, 2) + "\n");

  console.log(styleText("green", "Exports updated"));
} catch (error) {
  console.error(
    styleText("red", "Exports generation failed:"),
    typeof error === "object" && error !== null && "message" in error ? styleText("red", error.message as string) : (error as never),
  );
}
