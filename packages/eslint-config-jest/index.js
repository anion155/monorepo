/** @type {import('eslint').Linter.Config} */
const config = {
  overrides: [
    {
      files: ["**/__tests__/*.spec.*"],
      extends: ["./plain"],
    },
    {
      files: ["**/__tests__/*.spec.ts", "**/__tests__/*.spec.tsx"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
      },
    },
  ],
};

module.exports = config;
