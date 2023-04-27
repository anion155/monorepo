/**
 * @param {Partial<import('eslint').Linter.ConfigOverride>} [extension]
 * @return {import('eslint').Linter.ConfigOverride}
 */
const config = (extension) => ({
  ...extension,
  files: ["**/*.ts", "**/*.tsx", ...(extension?.files ?? [])],
  extends: [
    "./index.js",
    "airbnb-typescript",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/typescript",
    ...(extension?.extends ?? []),
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ...extension?.parserOptions,
    project: "./tsconfig.json",
  },
  settings: {
    ...extension?.settings,
    "import/resolver": {
      ...extension?.settings?.["import/resolver"],
      typescript: true,
    },
  },
  plugins: ["@typescript-eslint", ...(extension?.plugins ?? [])],
  rules: {
    ...extension?.rules,
    "@typescript-eslint/consistent-type-imports": [
      "warn",
      { prefer: "type-imports" },
    ],
    "@typescript-eslint/no-shadow": [
      "error",
      {
        ignoreTypeValueShadow: true,
        ignoreFunctionTypeParameterNameValueShadow: true,
      },
    ],
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        varsIgnorePattern: "[iI]gnored",
        argsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^ignore",
      },
    ],
  },
});

module.exports = config;
