import fs from "node:fs";

import { pathsToModuleNameMapper } from "ts-jest";

/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

/**
 * @param {...import('jest').Config} configs
 * @returns {import('jest').Config}
 */
export function jestConfig(...configs) {
  const array = (left, right) => {
    const toArray = (value) => (Array.isArray(value) ? value : [value]);
    return [...toArray(left), ...toArray(right)];
  };
  const orderedMap = (merge = (left, right) => right) => {
    return (left, right) => {
      const order = [];
      const options = {};
      const handle = (config) => {
        for (const value of config) {
          if (typeof value === "string") {
            const index = order.indexOf(value);
            if (index >= 0) {
              order.splice(index, 1);
              options[value] = merge(options[value], undefined);
            }
            order.push(value);
          } else {
            const name = value.unshift();
            const index = order.indexOf(value);
            if (index >= 0) {
              order.splice(index, 1);
              options[name] = merge(options[name], value[0]);
            } else {
              options[name] = value[0];
            }
            order.push(name);
          }
        }
      };
      handle(left);
      handle(right);
      return order.map((name) => (options[name] !== undefined ? [name, options[name]] : name));
    };
  };
  const object = (resolver = (left, right) => right) => {
    return (left, right) => {
      const values = { ...left };
      for (let key of Object.keys(right)) {
        values[key] = key in left ? resolver(left[key], right[key], key) : right[key];
      }
      return values;
    };
  };
  const schemed = (scheme) =>
    object((left, right, key) => {
      return key in scheme ? scheme[key](left, right) : right;
    });
  const config = configs.filter(Boolean).reduce(
    schemed({
      coveragePathIgnorePatterns: array,
      coverageReporters: orderedMap(),
      fakeTimers: object(),
      forceCoverageMatch: array,
      globals: object(),
      moduleDirectories: array,
      moduleFileExtensions: array,
      moduleNameMapper: object(array),
      modulePathIgnorePatterns: array,
      roots: array,
      setupFiles: array,
      setupFilesAfterEnv: array,
      snapshotSerializers: array,
      testEnvironmentOptions: object(),
      testMatch: array,
      testPathIgnorePatterns: array,
      testRegex: array,
      transform: object((left, right) => {
        const parse = (value) => (Array.isArray(value) ? value : [value, undefined]);
        const parsed = [parse(left), parse(right)];
        if (parsed[0][0] !== parsed[1][0]) return right;
        return [parsed[0][0], { ...parsed[0][1], ...parsed[1][1] }];
      }),
      transformIgnorePatterns: array,
      watchPathIgnorePatterns: array,
    }),
  );
  return config;
}

/** @type {import('jest').Config} */
export const base = {
  clearMocks: true,
};

/**
 * @param {string} [configPath]
 * @param {string} [baseConfigPath]
 * @returns {import('jest').Config}
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
