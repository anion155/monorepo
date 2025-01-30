/** @type {import('jest').Config} */
export const polyfillConfig = {
  setupFiles: ["@anion155/polyfill-base/setup-jest.ts"],
};

/** @param {import('jest').Config} config */
export const excludeProposals = (config) => {
  config.setupFiles = config.setupFiles.filter((module) => !module.includes("proposal"));
  return config;
};
