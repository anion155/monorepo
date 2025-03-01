#!/usr/bin/env bun
import { $ } from "bun";
import { styleText } from "node:util";
import type ts from "typescript";
import { createObjectMerger, createSchemeMerger, mergeArraysUnique, Scheme } from "./utils";

type CompilerOptions = typeof ts.parseCommandLine extends (...args: any[]) => infer TResult
  ? TResult extends { options: infer TOptions }
    ? TOptions
    : never
  : never;
type TypeAcquisition = typeof ts.parseCommandLine extends (...args: any[]) => infer TResult
  ? TResult extends { typeAcquisition?: infer TTypeAcquisition }
    ? TTypeAcquisition
    : never
  : never;
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
  exclude: ["dist", "coverage", "eslint.config.js", "jest.config.js", "**/*.spec.ts", "**/*.spec.tsx"],
  references: [{ path: "./tsconfig.jest.json" }],
};
const buildProject: TSConfig = {
  extends: "./tsconfig.base.json",
  include: ["src/index.ts"],
};
const jestProject: TSConfig = {
  extends: "./tsconfig.base.json",
  compilerOptions: {
    target: "ES2024" as never as ts.ScriptTarget,
    esModuleInterop: true,
    composite: true,
  },
  include: ["../configs/jest-setup.ts", "src/**/*.ts", "src/**/*.tsx"],
};

const tsConfigMerger = createSchemeMerger<Scheme<Partial<TSConfig>>>({
  compilerOptions: createObjectMerger<Partial<CompilerOptions> | undefined>(),
  exclude: mergeArraysUnique,
  extends: mergeArraysUnique,
  files: mergeArraysUnique,
  include: mergeArraysUnique,
  typeAcquisition: createObjectMerger<TypeAcquisition | undefined>(),
});
const mergeTsConfig = (...configs: TSConfig[]) => configs.filter(Boolean).reduce(tsConfigMerger);

const updateTsConfig = async (filename: string, project: TSConfig) => {
  if (await Bun.file(filename).exists()) {
    const mergedProject = mergeTsConfig(await Bun.file(filename).json(), project);
    await $`echo "${JSON.stringify(mergedProject, null, 2)}" > "${filename}"`;
  } else {
    await $`echo "${JSON.stringify(project, null, 2)}" > "${filename}"`;
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
  console.error(styleText("red", "Failed to setup typescript project:"), styleText("red", error.message));
}
