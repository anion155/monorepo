import comments from "@eslint-community/eslint-plugin-eslint-comments/configs";
import pluginJs from "@eslint/js";
import { Linter } from "eslint";
import prettier from "eslint-config-prettier";
import pluginJest from "eslint-plugin-jest";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import importSort from "eslint-plugin-simple-import-sort";
import { globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export const base: Linter.Config[] = [
  pluginJs.configs.recommended,
  prettier as never,
  comments.recommended as never,
  {
    plugins: { "simple-import-sort": importSort },
    rules: {
      "sort-imports": "off",
      "import-x/order": "off",
      "simple-import-sort/imports": "warn",
      "simple-import-sort/exports": "warn",
    },
  },
  globalIgnores(["coverage/"]),
];

export const typescript: Linter.Config[] = [
  ...(tseslint.configs.recommendedTypeChecked as never),
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
      "@typescript-eslint/consistent-type-imports": ["warn"],
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

export const jest: Linter.Config[] = [
  {
    files: ["**/*.{test,spec}.{js,jsx,ts,tsx}"],
    ...pluginJest.configs["flat/recommended"],
  },
];

export const react: Linter.Config[] = [
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
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs["jsx-runtime"].rules,
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": ["warn", { additionalHooks: "(useRenderEffect|useFabric)" }],
      "react/no-children-prop": "off",
      "react/no-unknown-property": "off",
    },
  },
];

export default base;
