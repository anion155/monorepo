import { createJiti } from "jiti";
import { createDefaultPreset } from "ts-jest";

const jiti = createJiti(import.meta.url);
/** @type {typeof import('./utils')} */
const { createObjectMerger, createOrderedMapMerger, createSchemeMerger, mergeArrays } = await jiti.import("./utils.ts");

/** @typedef {import('@jest/types').Config.InitialOptions} Config */

/** @type {import("./utils").Merger<Config>} */
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
 * @param {...Config} configs
 * @returns {Config}
 */
export function jestConfig(...configs) {
  return configs.filter(Boolean).reduce(jestConfigMerger);
}

/**
 * @param {(displayName: string) => Config | Config[]} baseFabric
 * @param {Record<string, [Config, ...Config[]]>} scheme
 * @returns {Config}
 */
export function jestProjects(baseFabric, scheme) {
  return {
    projects: Object.keys(scheme).map((displayName) => {
      let base = baseFabric(displayName);
      if (!Array.isArray(base)) base = [base];
      return jestConfig({ displayName }, ...base, ...scheme[displayName]);
    }),
  };
}

export const base = jestConfig({
  clearMocks: true,
  setupFiles: [
    "@anion155/proposal-explicit-resource-management/global",
    "@anion155/proposal-iterator-helpers/global",
    "@anion155/proposal-async-iterator-helpers/global",
    "@anion155/proposal-promise-with-resolvers/global",
  ],
});

/**
 * @param {string} [configPath]
 * @param {string} [baseConfigPath]
 */
export const typescript = (configPath = "./tsconfig.jest.json") => {
  return jestConfig(
    createDefaultPreset({
      tsconfig: configPath,
      astTransformers: {
        after: ["@anion155/configs/jest.transformer"],
      },
    }),
  );
};

export const reactDOM = jestConfig({
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["../configs/jest.react.ts"],
});
