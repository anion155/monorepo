const tsConfig = require("@anion155/eslint-config/typescript");
const jestConfig = require("@anion155/eslint-config/jest");

/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ["@anion155"],
  overrides: [jestConfig(), tsConfig()],
};
