import { jestConfig } from "@anion155/configs/jest.config";

/** @typedef {import("@anion155/configs/jest.config").Config} Config */

export const polyfillConfig = jestConfig({
  setupFiles: ["@anion155/polyfill-base/setup-jest.ts"],
});

/**
 * @param {Config} config
 * @returns {Config}
 */
export const excludeProposals = (config) => {
  config.setupFiles = config.setupFiles?.filter((module) => !module.includes("proposal") && module !== "@anion155/shared/jest");
  return config;
};
