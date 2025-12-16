/** @typedef {import("@anion155/configs/jest.config").Config} Config */
export const polyfillConfig = {
  setupFiles: ["@anion155/polyfill-base/setup-jest.ts"],
};

/**
 * @param {Config} config
 * @returns {Config}
 */
export const excludeProposals = (config) => {
  delete config.setupFiles;
  return config;
};
