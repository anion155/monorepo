import pluginJs from "@eslint/js";
import comments from "@eslint-community/eslint-plugin-eslint-comments/configs";
import prettier from "eslint-config-prettier";
import pluginJest from "eslint-plugin-jest";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import importSort from "eslint-plugin-simple-import-sort";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export const base = [
  pluginJs.configs.recommended,
  prettier,
  comments.recommended,
  {
    plugins: { "simple-import-sort": importSort },
    rules: {
      "sort-imports": "off",
      "import-x/order": "off",
      "simple-import-sort/imports": "warn",
      "simple-import-sort/exports": "warn",
    },
  },
];

/** @type {import('eslint').Linter.Config[]} */
export const typescript = [
  ...tseslint.config(tseslint.configs.recommendedTypeChecked),
  { languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } } },
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
      "@typescript-eslint/no-unsafe-declaration-merging": "off",
      "@typescript-eslint/no-empty-object-type": ["error", { allowInterfaces: "with-single-extends" }],
    },
  },
  {
    files: ["**/*.{test,spec}-d.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
];
typescript.forEach((config) => {
  if (config.files) return;
  config.files = ["**/*.{ts,tsx}"];
});

/** @type {import('eslint').Linter.Config[]} */
export const jest = [
  {
    files: ["**/*.{test,spec}.{js,jsx,ts,tsx}"],
    ...pluginJest.configs["flat/recommended"],
  },
];

/** @type {import('eslint').Linter.Config[]} */
export const react = [
  {
    files: ["**/use*.{js,jsx,ts,tsx}", "**/*.{jsx,tsx}"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs["jsx-runtime"].rules,
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": ["warn", { additionalHooks: "(useRenderEffect)" }],
    },
  },
];

export default base;
