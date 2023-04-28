const jestConfig = require('@anion155/eslint-config/jest');

/** @type {import('eslint').Linter.Config} */
module.exports = {
  "root": true,
  "extends": ["@anion155"],
  "parserOptions": {
    "project": "./tsconfig.json"
  },
  "overrides": [
    jestConfig({}),
  ]
}
