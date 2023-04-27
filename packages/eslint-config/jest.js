/**
 * @param {Partial<import('eslint').Linter.ConfigOverride>} extension
 * @return {import('eslint').Linter.ConfigOverride}
 */
const jestConfig = (extension) => {
  return {
    ...extension,
    files: ["**/__tests__/*.spec.*", ...(extension.files ?? [])],
    plugins: ["jest", ...(extension.plugins ?? [])],
    extends: [
      "plugin:jest/recommended",
      "plugin:jest/style",
      ...(extension.extends ?? []),
    ],
    rules: {
      "jest/expect-expect": [
        "warn",
        { assertFunctionNames: ["expect", "expectType"] },
      ],
      "jest/prefer-called-with": "error",
      "jest/prefer-hooks-on-top": "warn",
      "jest/prefer-spy-on": "warn",
      "jest/prefer-strict-equal": "error",
      "jest/require-to-throw-message": "warn",
      "@typescript-eslint/no-explicit-any": "off",
      ...extension.rules,
    },
  };
};

module.exports = jestConfig;
