/** @type {import('eslint').Linter.Config} */
const config = {
  extends: ["plugin:jest/recommended", "plugin:jest/style"],
  plugins: ["jest"],
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
  },
};

module.exports = config;
