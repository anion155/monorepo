import fs from "node:fs";

import { pathsToModuleNameMapper } from "ts-jest";

import { createObjectMerger, createOrderedMapMerger, createSchemeMerger, mergeArrays } from "./utils.js";

/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

/** @type {import("./utils").Merger<import('jest').Config>} */
const jestConfigMerger = createSchemeMerger({
  coveragePathIgnorePatterns: mergeArrays,
  coverageReporters: createOrderedMapMerger(),
  fakeTimers: createObjectMerger(),
  forceCoverageMatch: mergeArrays,
  globals: createObjectMerger(),
  moduleDirectories: mergeArrays,
  moduleFileExtensions: mergeArrays,
  moduleNameMapper: createObjectMerger(mergeArrays),
  modulePathIgnorePatterns: mergeArrays,
  roots: mergeArrays,
  setupFiles: mergeArrays,
  setupFilesAfterEnv: mergeArrays,
  snapshotSerializers: mergeArrays,
  testEnvironmentOptions: createObjectMerger(),
  testMatch: mergeArrays,
  testPathIgnorePatterns: mergeArrays,
  testRegex: mergeArrays,
  transform: createObjectMerger((left, right) => {
    const parse = (value) => (Array.isArray(value) ? value : [value, undefined]);
    const parsed = [parse(left), parse(right)];
    if (parsed[0][0] !== parsed[1][0]) return right;
    return [parsed[0][0], { ...parsed[0][1], ...parsed[1][1] }];
  }),
  transformIgnorePatterns: mergeArrays,
  watchPathIgnorePatterns: mergeArrays,
});
/**
 * @param {...import('jest').Config} configs
 * @returns {import('jest').Config}
 */
export function jestConfig(...configs) {
  const config = configs.filter(Boolean).reduce(jestConfigMerger);
  return config;
}

/**
 * @param {Record<string, [RequiredSome<import('jest').Config, 'testMatch'>, ...import('jest').Config[]]>} scheme
 * @returns {import('jest').Config}
 */
export function jestProjects(scheme) {
  return {
    projects: Object.keys(scheme).map((displayName) => jestConfig({ displayName }, ...scheme[displayName])),
  };
}

export const base = jestConfig({
  clearMocks: true,
});

/**
 * @param {string} [configPath]
 * @param {string} [baseConfigPath]
 */
export const typescript = (configPath = "./tsconfig.jest.json", baseConfigPath = "./tsconfig.json") => {
  const { compilerOptions } = JSON.parse(fs.readFileSync(baseConfigPath, "utf-8"));
  return jestConfig(
    {
      preset: "ts-jest",
      transform: {
        "^.+.tsx?$": ["ts-jest", { tsconfig: configPath }],
      },
      setupFiles: ["../proposal-explicit-resource-management/global.ts", "../proposal-promise-with-resolvers/global.ts"],
    },
    compilerOptions?.paths && {
      roots: ["<rootDir>"],
      modulePaths: [compilerOptions.baseUrl],
      moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: "<rootDir>/" }),
    },
  );
};

export const reactDOM = jestConfig({
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["../configs/jest-setup.ts"],
});
