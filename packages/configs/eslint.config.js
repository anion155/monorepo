import comments from "@eslint-community/eslint-plugin-eslint-comments/configs";
import pluginJs from "@eslint/js";
import prettier from "eslint-config-prettier";
import pluginJest from "eslint-plugin-jest";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export const base = [{ files: ["**/*.{js,mjs,cjs,ts}"] }, pluginJs.configs.recommended, prettier, comments.recommended];

/** @type {import('eslint').Linter.Config[]} */
export const typescript = [
  ...tseslint.config(
    tseslint.configs.recommendedTypeChecked,
    {
      languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
    },
    {
      rules: {
        "@typescript-eslint/no-unused-vars": [
          "error",
          {
            args: "after-used",
            argsIgnorePattern: "^_",
            caughtErrors: "all",
            caughtErrorsIgnorePattern: "^_",
            destructuredArrayIgnorePattern: "^_",
            varsIgnorePattern: "^_",
            ignoreRestSiblings: true,
          },
        ],
        "@typescript-eslint/unbound-method": "off",
      },
    },
  ),
  {
    files: ["**/*.{test,spec}-d.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
];

/** @type {import('eslint').Linter.Config[]} */
export const jest = [
  {
    files: ["**/*.{test,spec}.{js,jsx,ts,tsx}"],
    ...pluginJest.configs["flat/recommended"],
  },
];

export default base;
