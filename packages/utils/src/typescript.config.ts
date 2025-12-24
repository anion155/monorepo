#!/usr/bin/env node
import { createObjectMerger, createSchemeMerger, mergeArraysUnique, Scheme } from "@anion155/configs/utils";
import * as fs from "node:fs";
import { styleText } from "node:util";
import type { CompilerOptions, TypeAcquisition } from "typescript";
import { $ } from "zx";

type TSConfig = {
  compilerOptions?: CompilerOptions;
  exclude?: string[];
  compileOnSave?: boolean;
  extends?: string | string[];
  files?: string[];
  include?: string[];
  typeAcquisition?: TypeAcquisition;
  references?: { path: string }[];
};

const baseProject: TSConfig = {
  extends: "@anion155/configs/tsconfig.base.json",
};
const project: TSConfig = {
  extends: "./tsconfig.base.json",
  exclude: ["dist", "coverage", "jest.config.js", "src/**/*.spec.ts", "src/**/*.spec.tsx"],
  references: [{ path: "./tsconfig.jest.json" }],
};
const buildProject: TSConfig = {
  extends: "./tsconfig.base.json",
  include: ["src/index.ts"],
};
const jestProject: TSConfig = {
  extends: "./tsconfig.base.json",
  compilerOptions: {
    target: "ES2024" as never,
    types: ["node", "jest"],
    esModuleInterop: true,
    composite: true,
  },
  include: ["src/**/*.ts", "src/**/*.tsx"],
};

const tsConfigMerger = createSchemeMerger<Scheme<Partial<TSConfig>>>({
  compilerOptions: createObjectMerger() as never,
  extends: (left, right) => {
    const bases = mergeArraysUnique(left, right);
    if (!bases) return bases;
    return bases.length === 1 ? bases[0] : bases;
  },
  exclude: mergeArraysUnique,
  files: mergeArraysUnique,
  include: mergeArraysUnique,
  typeAcquisition: createObjectMerger() as never,
});
const mergeTsConfig = (...configs: TSConfig[]) => configs.filter(Boolean).reduce(tsConfigMerger);

const updateTsConfig = async (filename: string, project: TSConfig) => {
  if (fs.existsSync(filename)) {
    const prevProject = JSON.parse(fs.readFileSync(filename, { encoding: "utf-8" }));
    const mergedProject = mergeTsConfig(prevProject, project);
    fs.writeFileSync(filename, JSON.stringify(mergedProject, null, 2), { encoding: "utf-8" });
  } else {
    fs.writeFileSync(filename, JSON.stringify(project, null, 2), { encoding: "utf-8" });
  }
  await $`prettier --write "${filename}"`;
};

try {
  await updateTsConfig("./tsconfig.base.json", baseProject);
  await updateTsConfig("./tsconfig.json", project);
  await updateTsConfig("./tsconfig.jest.json", jestProject);
  await updateTsConfig("./tsconfig.build.json", buildProject);
  console.log(styleText("green", "Project setup complete"));
} catch (error) {
  console.error(styleText("red", "Failed to setup typescript project:"), styleText("red", error instanceof Error ? error.message : String(error)));
}
